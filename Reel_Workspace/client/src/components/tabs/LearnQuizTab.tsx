import { useState } from "react";
import { Reel } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, Check, Lightbulb } from "lucide-react";
import { copyToClipboard } from "../../utils/clipboard";
import { toast } from "sonner";

interface LearnQuizTabProps {
  reel: Reel;
}

export function LearnQuizTab({ reel }: LearnQuizTabProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleCopyPrompt = async (prompt: string, index: number) => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopiedPrompt(index);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopiedPrompt(null), 2000);
    } else {
      toast.error("Failed to copy prompt");
    }
  };

  // Calculate score
  const correctAnswers =
    reel.quizQuestions?.filter(
      (q, index) => selectedAnswers[index] === q.correctAnswer
    ).length || 0;
  const totalQuestions = reel.quizQuestions?.length || 0;

  return (
    <div className="space-y-8">
      {/* Quiz Questions - Enhanced */}
      {reel.quizQuestions && reel.quizQuestions.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              Quiz Questions
            </h3>
            {showResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetQuiz}
                className="gap-2 hover:bg-muted/80 border-border/60"
              >
                Reset Quiz
              </Button>
            )}
          </div>
          <div className="space-y-5">
            {reel.quizQuestions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all"
              >
                <p className="font-bold text-lg mb-4 text-foreground">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="space-y-2.5">
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === oIndex;
                    const isCorrect = question.correctAnswer === oIndex;
                    const showCorrect = showResults && isCorrect;
                    const showWrong = showResults && isSelected && !isCorrect;

                    return (
                      <button
                        key={oIndex}
                        onClick={() =>
                          !showResults && handleAnswerSelect(qIndex, oIndex)
                        }
                        disabled={showResults}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${
                          showCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100"
                            : showWrong
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100"
                            : isSelected
                            ? "border-primary bg-primary/10 text-foreground shadow-sm"
                            : "border-border/60 hover:border-primary/50 hover:bg-muted/30 text-foreground/80"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {showResults && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                      <strong className="font-bold">Explanation:</strong>{" "}
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!showResults &&
            Object.keys(selectedAnswers).length ===
              reel.quizQuestions.length && (
              <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow transition-all"
              >
                Submit Quiz
              </Button>
            )}
          {showResults && totalQuestions > 0 && (
            <div className="mt-5 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Score: {correctAnswers}/{totalQuestions} correct
              </p>
              <p className="text-base text-blue-700 dark:text-blue-300 mt-2 font-medium">
                {correctAnswers === totalQuestions
                  ? "Perfect score! 🎉"
                  : correctAnswers >= totalQuestions / 2
                  ? "Good job! Keep learning! 👍"
                  : "Keep practicing! 💪"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Common Pitfalls - Enhanced */}
      {reel.commonPitfalls && reel.commonPitfalls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Common Pitfalls
          </h3>
          <div className="space-y-3">
            {reel.commonPitfalls.map((pitfall, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-card border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  {pitfall.severity && (
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide ${
                        pitfall.severity === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          : pitfall.severity === "medium"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                      }`}
                    >
                      {pitfall.severity}
                    </span>
                  )}
                </div>
                <p className="font-bold text-lg mb-3 text-foreground">
                  ⚠️ {pitfall.pitfall}
                </p>
                <p className="text-base text-foreground/80 leading-relaxed">
                  <strong className="font-bold text-foreground">
                    Solution:
                  </strong>{" "}
                  {pitfall.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Prompt Suggestions - Enhanced */}
      {reel.interactivePromptSuggestions &&
        reel.interactivePromptSuggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              AI Prompt Suggestions
            </h3>
            <div className="space-y-3">
              {reel.interactivePromptSuggestions.map((prompt, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-muted/70 transition-all group"
                >
                  <code className="flex-1 text-sm text-foreground/90 break-words font-mono leading-relaxed">
                    {prompt}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPrompt(prompt, index)}
                    className="flex-shrink-0 hover:bg-background"
                  >
                    {copiedPrompt === index ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
