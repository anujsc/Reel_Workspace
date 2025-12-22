import { useState } from "react";
import { Reel } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BookOpen, Copy, Check, Lightbulb } from "lucide-react";
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
    <div className="space-y-6">
      {/* Quiz Questions */}
      {reel.quizQuestions && reel.quizQuestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quiz Questions</h3>
            {showResults && (
              <Button variant="outline" size="sm" onClick={resetQuiz}>
                Reset Quiz
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {reel.quizQuestions.map((question, qIndex) => (
              <div key={qIndex} className="calm-card">
                <p className="font-semibold mb-3">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
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
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          showCorrect
                            ? "border-green-500 bg-green-50"
                            : showWrong
                            ? "border-red-500 bg-red-50"
                            : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {showResults && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!showResults &&
            Object.keys(selectedAnswers).length ===
              reel.quizQuestions.length && (
              <Button onClick={handleSubmit} className="w-full mt-4">
                Submit Quiz
              </Button>
            )}
          {showResults && totalQuestions > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-lg font-semibold text-blue-900">
                Score: {correctAnswers}/{totalQuestions} correct
              </p>
              <p className="text-sm text-blue-700 mt-1">
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

      {/* Glossary */}
      {reel.glossary && reel.glossary.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Glossary
          </h3>
          <div className="space-y-3">
            {reel.glossary.map((term, index) => (
              <div key={index} className="calm-card">
                <h4 className="font-semibold mb-1">{term.term}</h4>
                <p className="text-sm text-muted-foreground">
                  {term.definition}
                </p>
                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {term.relatedTerms.map((related, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                      >
                        {related}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Pitfalls */}
      {reel.commonPitfalls && reel.commonPitfalls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Common Pitfalls
          </h3>
          <div className="space-y-3">
            {reel.commonPitfalls.map((pitfall, index) => (
              <div
                key={index}
                className="calm-card border-l-4 border-orange-500"
              >
                <div className="flex items-start gap-2 mb-2">
                  {pitfall.severity && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        pitfall.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : pitfall.severity === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {pitfall.severity}
                    </span>
                  )}
                </div>
                <p className="font-semibold mb-2">⚠️ {pitfall.pitfall}</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Solution:</strong> {pitfall.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Prompt Suggestions */}
      {reel.interactivePromptSuggestions &&
        reel.interactivePromptSuggestions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Prompt Suggestions
            </h3>
            <div className="space-y-2">
              {reel.interactivePromptSuggestions.map((prompt, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <code className="flex-1 text-sm text-gray-800 break-words">
                    {prompt}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPrompt(prompt, index)}
                    className="flex-shrink-0"
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
