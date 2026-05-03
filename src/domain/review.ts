import { clamp } from "@/lib/utils"
import type { Flashcard, ReviewRating } from "./types"

const ratingQuality: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

export function scheduleReview(card: Flashcard, rating: ReviewRating, reviewedAt = new Date()): Flashcard {
  const quality = ratingQuality[rating]
  let easeFactor = card.easeFactor || 2.5
  let intervalDays = card.intervalDays || 0
  let lapses = card.lapses

  if (rating === "again") {
    intervalDays = 0.04
    easeFactor = Math.max(1.3, easeFactor - 0.2)
    lapses += 1
  } else {
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    )

    if (card.reviewCount === 0) {
      intervalDays = rating === "hard" ? 1 : rating === "good" ? 2 : 4
    } else if (card.reviewCount === 1) {
      intervalDays = rating === "hard" ? 3 : rating === "good" ? 6 : 8
    } else {
      const multiplier = rating === "hard" ? 1.2 : rating === "good" ? easeFactor : easeFactor * 1.35
      intervalDays = Math.max(1, Math.round(intervalDays * multiplier))
    }
  }

  const dueAt = new Date(reviewedAt)
  dueAt.setMinutes(dueAt.getMinutes() + intervalDays * 24 * 60)

  const masteryDelta = rating === "again" ? -18 : rating === "hard" ? 4 : rating === "good" ? 11 : 17
  const confidenceDelta = rating === "again" ? -15 : rating === "hard" ? 3 : rating === "good" ? 10 : 14

  return {
    ...card,
    dueAt: dueAt.toISOString(),
    intervalDays,
    easeFactor,
    lapses,
    reviewCount: card.reviewCount + 1,
    lastReviewedAt: reviewedAt.toISOString(),
    masteryScore: clamp(card.masteryScore + masteryDelta, 0, 100),
    confidenceScore: clamp(card.confidenceScore + confidenceDelta, 0, 100),
    staleStatus: card.staleStatus,
    updatedAt: reviewedAt.toISOString(),
  }
}

export function isDue(card: Flashcard, now = new Date()) {
  return new Date(card.dueAt).getTime() <= now.getTime()
}

export function isWeak(card: Flashcard) {
  return card.masteryScore < 55 || card.confidenceScore < 50 || card.lapses >= 2
}
