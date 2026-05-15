/**
 * AI Service — OpenAI-powered smart search and course recommendations.
 *
 * Set EXPO_PUBLIC_OPENAI_API_KEY in your .env to enable real AI calls.
 * When the key is absent the service falls back to local keyword matching
 * so the app still works without a paid API key.
 */

import { Course } from "@/src/types";
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Client (lazy-initialised so missing key doesn't crash at import time)
// ---------------------------------------------------------------------------
let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function courseToText(c: Course): string {
  return `ID:${c.id} | ${c.title} | ${c.description ?? ""}`;
}

function localKeywordSearch(query: string, courses: Course[]): Course[] {
  const q = query.toLowerCase();
  return courses.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// Smart Search
// ---------------------------------------------------------------------------

/**
 * Returns courses that match `query` semantically.
 * Falls back to local keyword matching when OpenAI is unavailable.
 */
export async function smartSearch(
  query: string,
  courses: Course[]
): Promise<Course[]> {
  if (!query.trim()) return courses;

  const client = getClient();
  if (!client) return localKeywordSearch(query, courses);

  try {
    const catalogSnippet = courses
      .slice(0, 50) // keep prompt small
      .map(courseToText)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a course search assistant. Given a user query and a list of courses, " +
            "return only the IDs of the courses most relevant to the query. " +
            'Respond with a JSON array of strings, e.g. ["1","5","12"]. No extra text.',
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nCourses:\n${catalogSnippet}`,
        },
      ],
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const ids: string[] = JSON.parse(raw);
    const matched = courses.filter((c) => ids.includes(String(c.id)));
    // Preserve any local matches not returned by AI as well
    const local = localKeywordSearch(query, courses);
    const combined = [
      ...matched,
      ...local.filter((lc) => !matched.some((m) => m.id === lc.id)),
    ];
    return combined;
  } catch {
    return localKeywordSearch(query, courses);
  }
}

// ---------------------------------------------------------------------------
// Personalised Recommendations
// ---------------------------------------------------------------------------

/**
 * Given courses the user has enrolled in, returns up to `limit` recommended
 * courses from `allCourses` that they haven't enrolled in yet.
 * Falls back to returning the first `limit` un-enrolled courses.
 */
export async function getRecommendations(
  enrolledCourses: Course[],
  allCourses: Course[],
  limit = 5
): Promise<Course[]> {
  const unEnrolled = allCourses.filter(
    (c) => !enrolledCourses.some((e) => e.id === c.id)
  );

  if (unEnrolled.length === 0) return [];

  const client = getClient();
  if (!client || enrolledCourses.length === 0) return unEnrolled.slice(0, limit);

  try {
    const enrolledTitles = enrolledCourses
      .map((c) => c.title)
      .slice(0, 10)
      .join(", ");

    const candidateSnippet = unEnrolled
      .slice(0, 50)
      .map(courseToText)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a course recommendation engine. Given courses a learner has taken and a " +
            "list of candidate courses, return the IDs of the top recommended courses. " +
            `Return exactly up to ${limit} IDs as a JSON array, e.g. ["3","7"]. No extra text.`,
        },
        {
          role: "user",
          content: `Enrolled courses: ${enrolledTitles}\n\nCandidates:\n${candidateSnippet}`,
        },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const ids: string[] = JSON.parse(raw);
    const recommended = unEnrolled.filter((c) => ids.includes(String(c.id)));
    if (recommended.length === 0) return unEnrolled.slice(0, limit);
    return recommended.slice(0, limit);
  } catch {
    return unEnrolled.slice(0, limit);
  }
}
