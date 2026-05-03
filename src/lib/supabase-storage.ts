import { supabase } from "@/lib/supabase"

export type CourseStorageBucket = "course-images" | "course-documents" | "course-exports"

interface UploadCourseFileInput {
  userId: string
  courseId: string
  bucket: CourseStorageBucket
  file: File
  pathPrefix?: string
}

function cleanSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function courseStoragePath({ userId, courseId, file, pathPrefix = "uploads" }: UploadCourseFileInput) {
  const filename = cleanSegment(file.name) || "file"
  const prefix = cleanSegment(pathPrefix) || "uploads"
  return `${userId}/${courseId}/${prefix}/${crypto.randomUUID()}-${filename}`
}

export async function uploadCourseFile(input: UploadCourseFileInput) {
  if (!supabase) throw new Error("Supabase is not configured")
  const path = courseStoragePath(input)
  const { data, error } = await supabase.storage.from(input.bucket).upload(path, input.file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw new Error(error.message)
  return data.path
}

export async function createSignedCourseFileUrl(bucket: CourseStorageBucket, storagePath: string, expiresInSeconds = 3600) {
  if (!supabase) throw new Error("Supabase is not configured")
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds)

  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function removeCourseFile(bucket: CourseStorageBucket, storagePath: string) {
  if (!supabase) throw new Error("Supabase is not configured")
  const { error } = await supabase.storage.from(bucket).remove([storagePath])
  if (error) throw new Error(error.message)
}
