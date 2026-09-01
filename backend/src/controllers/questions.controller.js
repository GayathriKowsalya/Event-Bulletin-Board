import { supabaseAdmin } from "../config/supabase.js";

/* ============================================================
   GET EVENT
   ============================================================ */

async function getEvent(id) {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id,status,created_by,event_end_date")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/* ============================================================
   ATTACH PROFILES
   ============================================================ */

async function attachProfiles(items) {
  const ids = [
    ...new Set((items || []).map((item) => item.user_id).filter(Boolean)),
  ];

  if (!ids.length) {
    return items || [];
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,name,full_name,avatar_url")
    .in("id", ids);

  if (error) throw error;

  const map = new Map((data || []).map((profile) => [profile.id, profile]));

  return (items || []).map((item) => ({
    ...item,
    profile: map.get(item.user_id) || null,
  }));
}

/* ============================================================
   LIST QUESTIONS
   ============================================================ */

export async function listQuestions(req, res, next) {
  try {
    const event = await getEvent(req.params.id);

    if (!event) {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    /*
      Q&A can be VIEWED for published events.

      We intentionally do NOT require the user
      to be logged in just to load Q&A.

      This prevents:
      "Failed to load Q&A"
      for logged-out / newly logged-in users.
    */

    if (event.status !== "published") {
      const isOwner = req.user?.id && req.user.id === event.created_by;

      const isAdmin = req.profile?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(404).json({
          error: "Event not found.",
        });
      }
    }

    /* Get questions */

    const { data: questions, error: questionError } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("event_id", req.params.id)
      .order("created_at", {
        ascending: false,
      });

    if (questionError) {
      throw questionError;
    }

    /* Attach question profiles */

    const questionItems = await attachProfiles(questions || []);

    /* Get answers */

    const questionIds = questionItems.map((question) => question.id);

    let answers = [];

    if (questionIds.length > 0) {
      const { data, error: answerError } = await supabaseAdmin
        .from("answers")
        .select("*")
        .in("question_id", questionIds)
        .order("created_at", {
          ascending: true,
        });

      if (answerError) {
        throw answerError;
      }

      answers = await attachProfiles(data || []);
    }

    /* Group answers by question */

    const answerMap = new Map();

    for (const answer of answers) {
      if (!answerMap.has(answer.question_id)) {
        answerMap.set(answer.question_id, []);
      }

      answerMap.get(answer.question_id).push(answer);
    }

    /* Build final response */

    const result = questionItems.map((question) => ({
      ...question,
      answers: answerMap.get(question.id) || [],
    }));

    res.json({
      questions: result,
    });
  } catch (error) {
    console.error("[Q&A] Failed to load questions:", error);

    next(error);
  }
}

/* ============================================================
   POST QUESTION
   ============================================================ */

export async function postQuestion(req, res, next) {
  try {
    /*
      Login is required to ASK a question.
    */

    if (!req.user?.id) {
      return res.status(401).json({
        error: "Please log in to ask a question.",
      });
    }

    const event = await getEvent(req.params.id);

    if (!event || event.status !== "published") {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    const question = String(req.body.question || "").trim();

    if (!question) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        error: "Question cannot exceed 1000 characters.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("questions")
      .insert({
        event_id: req.params.id,
        user_id: req.user.id,
        question,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const [item] = await attachProfiles([data]);

    res.status(201).json({
      question: {
        ...item,
        answers: [],
      },
    });
  } catch (error) {
    console.error("[Q&A] Failed to post question:", error);

    next(error);
  }
}

/* ============================================================
   POST ANSWER
   ============================================================ */

export async function postAnswer(req, res, next) {
  try {
    /*
      Login is required to answer.
    */

    if (!req.user?.id) {
      return res.status(401).json({
        error: "Please log in to answer.",
      });
    }

    const event = await getEvent(req.params.id);

    if (!event || event.status !== "published") {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    /* Check question belongs to event */

    const { data: question, error: questionError } = await supabaseAdmin
      .from("questions")
      .select("id")
      .eq("id", req.params.questionId)
      .eq("event_id", req.params.id)
      .maybeSingle();

    if (questionError) {
      throw questionError;
    }

    if (!question) {
      return res.status(404).json({
        error: "Question not found.",
      });
    }

    const answer = String(req.body.answer || "").trim();

    if (!answer) {
      return res.status(400).json({
        error: "Answer is required.",
      });
    }

    if (answer.length > 2000) {
      return res.status(400).json({
        error: "Answer cannot exceed 2000 characters.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("answers")
      .insert({
        question_id: question.id,
        user_id: req.user.id,
        answer,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const [item] = await attachProfiles([data]);

    res.status(201).json({
      answer: item,
    });
  } catch (error) {
    console.error("[Q&A] Failed to post answer:", error);

    next(error);
  }
}

/* ============================================================
   DELETE QUESTION
   ============================================================ */

export async function deleteQuestion(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Please log in.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("id", req.params.questionId)
      .eq("event_id", req.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: "Question not found.",
      });
    }

    const isAdmin = req.profile?.role === "admin";

    const isOwner = data.user_id === req.user.id;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "You cannot delete this question.",
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("questions")
      .delete()
      .eq("id", data.id);

    if (deleteError) {
      throw deleteError;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[Q&A] Failed to delete question:", error);

    next(error);
  }
}

/* ============================================================
   DELETE ANSWER
   ============================================================ */

export async function deleteAnswer(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Please log in.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("answers")
      .select("*")
      .eq("id", req.params.answerId)
      .eq("question_id", req.params.questionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: "Answer not found.",
      });
    }

    const isAdmin = req.profile?.role === "admin";

    const isOwner = data.user_id === req.user.id;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "You cannot delete this answer.",
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("answers")
      .delete()
      .eq("id", data.id);

    if (deleteError) {
      throw deleteError;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[Q&A] Failed to delete answer:", error);

    next(error);
  }
}
