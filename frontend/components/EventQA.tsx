import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getEventQuestions, postEventQuestion, postEventAnswer, deleteEventQuestion, deleteEventAnswer } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Trash2, CornerDownRight } from "lucide-react";

interface EventQAProps {
  eventId: string;
}

export function EventQA({ eventId }: EventQAProps) {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [eventId]);

  const fetchQuestions = async () => {
    try {
      const data = await getEventQuestions(eventId);
      setQuestions(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load Q&A");
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmittingQuestion(true);
    try {
      const createdQuestion = await postEventQuestion(eventId, newQuestion);
      setQuestions([createdQuestion, ...questions]);
      setNewQuestion("");
      toast.success("Question posted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to post question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handlePostAnswer = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    setSubmittingAnswer(true);
    try {
      const createdAnswer = await postEventAnswer(eventId, questionId, newAnswer);
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return { ...q, answers: [...(q.answers || []), createdAnswer] };
        }
        return q;
      }));
      setNewAnswer("");
      setReplyingTo(null);
      toast.success("Answer posted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to post answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteEventQuestion(eventId, id);
      setQuestions(questions.filter(q => q.id !== id));
      toast.success("Question deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete question");
    }
  };

  const handleDeleteAnswer = async (questionId: string, id: string) => {
    try {
      await deleteEventAnswer(eventId, questionId, id);
      setQuestions(questions.map(q => ({
        ...q,
        answers: (q.answers || []).filter((a: any) => a.id !== id)
      })));
      toast.success("Answer deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete answer");
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" /> Questions & Answers
      </h3>
      
      {user ? (
        <form onSubmit={handleAskQuestion} className="mb-8 space-y-3">
          <Textarea 
            placeholder="Ask a question about this event..." 
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="bg-[#09090b] border-[#27272a] text-white resize-none"
            rows={2}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submittingQuestion || !newQuestion.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submittingQuestion ? "Posting..." : "Ask Question"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-[#09090b] border border-[#27272a] rounded-lg text-center text-gray-400">
          Please log in to ask a question.
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse border-b border-[#27272a] pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-24 bg-[#27272a] rounded"></div>
                  <div className="h-3 w-16 bg-[#27272a]/50 rounded ml-2"></div>
                </div>
                <div className="h-4 w-full bg-[#27272a] rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-[#27272a] rounded"></div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-[#27272a] rounded-lg bg-[#09090b]">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No questions yet.</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to ask about this event.</p>
          </div>
        ) : (
          questions.map(q => (
            <div key={q.id} className="border-b border-[#27272a] pb-6 last:border-0">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <span className="font-bold text-gray-200">{q.profile?.full_name || "Unknown"}</span>
                  <span className="text-xs text-gray-500 ml-2">{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
                {(isAdmin || q.user_id === user?.id) && (
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-gray-300 mb-3">{q.question}</p>
              
              <div className="pl-6 space-y-4">
                {q.answers?.map((a: any) => (
                  <div key={a.id} className="bg-[#09090b] p-3 rounded-lg border border-[#27272a]">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-4 h-4 text-gray-500" />
                        <span className="font-bold text-gray-200 text-sm">{a.profile?.full_name || "Unknown"}</span>
                      </div>
                      {(isAdmin || a.user_id === user?.id) && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAnswer(q.id, a.id)} className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm pl-6">{a.answer}</p>
                  </div>
                ))}

                {user && replyingTo !== q.id && (
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(q.id)} className="text-gray-400 hover:text-white h-8">
                    Reply
                  </Button>
                )}

                {replyingTo === q.id && (
                  <form onSubmit={(e) => handlePostAnswer(e, q.id)} className="mt-2 space-y-2">
                    <Textarea 
                      placeholder="Write your answer..." 
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      className="bg-[#09090b] border-[#27272a] text-white resize-none text-sm"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-8">Cancel</Button>
                      <Button type="submit" size="sm" disabled={submittingAnswer || !newAnswer.trim()} className="bg-primary h-8">
                        {submittingAnswer ? "Posting..." : "Post Answer"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
