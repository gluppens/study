import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1"

type SuggestionRequest = {
  courseId: string
  targetType: "content_block" | "appendix_record"
  targetId: string
  mode: "flashcards" | "appendix_items" | "links" | "study_plan"
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const aiApiKey = Deno.env.get("AI_API_KEY")
  const aiEndpoint = Deno.env.get("AI_ENDPOINT")
  const aiModel = Deno.env.get("AI_MODEL") ?? "configured-study-model"

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Supabase service credentials are not configured." }, { status: 500, headers: corsHeaders })
  }

  const authHeader = request.headers.get("Authorization")
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : undefined },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader?.replace("Bearer ", "") ?? "")

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
  }

  const body = (await request.json()) as SuggestionRequest

  const { data: course } = await supabase
    .from("courses")
    .select("id, owner_id, title, main_language, subject")
    .eq("id", body.courseId)
    .single()

  if (!course || course.owner_id !== user.id) {
    return Response.json({ error: "Course not found" }, { status: 404, headers: corsHeaders })
  }

  const target =
    body.targetType === "content_block"
      ? await supabase
          .from("content_blocks")
          .select("id, plain_text, block_type, version, content_hash")
          .eq("id", body.targetId)
          .eq("course_id", body.courseId)
          .single()
      : await supabase
          .from("appendix_records")
          .select("id, title, short_description, record_type, version, record_hash")
          .eq("id", body.targetId)
          .eq("course_id", body.courseId)
          .single()

  if (target.error || !target.data) {
    return Response.json({ error: "Target not found" }, { status: 404, headers: corsHeaders })
  }

  const sourceText =
    body.targetType === "content_block"
      ? target.data.plain_text
      : `${target.data.title}: ${target.data.short_description}`

  let payload: Record<string, unknown> = {
    cards: [
      {
        cardType: "basic",
        prompt: `Explain: ${sourceText.slice(0, 80)}`,
        answer: sourceText,
        sourceTargetType: body.targetType,
        sourceTargetId: body.targetId,
      },
    ],
  }

  if (aiApiKey && aiEndpoint) {
    const aiResponse = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        instructions:
          "Generate safe study suggestions only. Return JSON with a cards array. Do not rewrite source content.",
        input: {
          course: {
            title: course.title,
            subject: course.subject,
            language: course.main_language,
          },
          targetType: body.targetType,
          sourceText,
          mode: body.mode,
        },
      }),
    })

    if (aiResponse.ok) {
      const json = await aiResponse.json()
      payload = json.output_json ?? json
    }
  }

  const { data: suggestion, error } = await supabase
    .from("ai_suggestions")
    .insert({
      course_id: body.courseId,
      suggestion_type: body.mode,
      status: "pending",
      title: body.mode === "flashcards" ? "Generated flashcard suggestions" : "Generated study suggestions",
      summary: `Suggestions from ${body.targetType.replace("_", " ")} ${body.targetId}`,
      payload,
      model: aiModel,
      prompt_version: "mvp-1",
      risk_level: "low",
      created_by_context: {
        targetType: body.targetType,
        targetId: body.targetId,
        sourceExcerpt: sourceText.slice(0, 400),
      },
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }

  await supabase.from("ai_suggestion_targets").insert({
    ai_suggestion_id: suggestion.id,
    target_type: body.targetType,
    target_id: body.targetId,
    target_version: target.data.version,
    target_hash: target.data.content_hash ?? target.data.record_hash,
  })

  return Response.json({ suggestion }, { headers: corsHeaders })
})
