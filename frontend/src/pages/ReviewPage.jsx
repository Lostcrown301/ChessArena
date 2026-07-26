import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Section } from '@components/common/Section';
import { EmptyState } from '@components/common/EmptyState';
import { Button } from '@components/ui/Button';
import { ReviewBoardPanel } from '@components/review/ReviewBoardPanel';
import { ReviewControls } from '@components/review/ReviewControls';
import { ReviewMoveList } from '@components/review/ReviewMoveList';
import { ReviewPgnPanel } from '@components/review/ReviewPgnPanel';
import { AnalysisPanel } from '@components/game/analysis/AnalysisPanel';
import { AIAnalysisPanel } from '@components/game/ai/AIAnalysisPanel';
import { explainAnalysis } from '@services/api/AIService';
import { getHistoryReview } from '@services/api/HistoryService';

export function ReviewPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [orientation, setOrientation] = useState('white');
  
  const [explanation, setExplanation] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiStyle, setAiStyle] = useState('beginner');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await getHistoryReview(gameId);
        if (mounted) {
          setReviewData(data);
          // Set to the final state
          setCurrentIndex(data.moves?.length ? data.moves.length - 1 : -1);
        }
      } catch {
        if (mounted) setError('Failed to load review data. The game might not exist or analysis is missing.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [gameId]);

  const handleExplain = async () => {
    if (!reviewData?.analysis?.id) return;
    
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      // Assuming context isn't strictly necessary or we pass basic context
      const context = {
        pgn: reviewData.game.pgn,
        currentFen: reviewData.moves[currentIndex]?.fen,
        gameResult: reviewData.game.result,
      };
      
      const result = await explainAnalysis({
        analysisId: reviewData.analysis.id,
        context,
        playerColor: 'white', // We don't have a logged-in user context in review, default to white
        style: aiStyle,
      });
      setExplanation(result);
    } catch (err) {
      setAiError(err.message || 'Failed to generate explanation.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleStyleChange = (style) => {
    setAiStyle(style);
    if (explanation) {
      // Re-trigger if already have one, but for simplicity, we could just let them click 'Explain Position' again.
      // Wait, let's auto trigger if it's already generated.
      setTimeout(() => {
        // Need to use the latest style in handleExplain, so we rely on state.
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-96 rounded-lg bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState title="Review Unavailable">
          {error}
          <div className="mt-4">
            <Button onClick={() => navigate('/history')}>Back to History</Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  const { game, moves, analysis } = reviewData;
  const currentMove = currentIndex >= 0 ? moves[currentIndex] : null;
  const fen = currentMove ? currentMove.fen : 'start';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title={`Review: ${game.whitePlayer.displayName} vs ${game.blackPlayer.displayName}`}>
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Board and Controls */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <ReviewBoardPanel
              position={fen}
              orientation={orientation}
              lastMove={currentMove}
            />
            <ReviewControls
              currentIndex={currentIndex}
              totalMoves={moves.length}
              onFirst={() => setCurrentIndex(-1)}
              onPrev={() => setCurrentIndex((prev) => Math.max(-1, prev - 1))}
              onNext={() => setCurrentIndex((prev) => Math.min(moves.length - 1, prev + 1))}
              onLast={() => setCurrentIndex(moves.length - 1)}
              onFlipBoard={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
            />
            <ReviewPgnPanel pgn={game.pgn} />
          </div>

          {/* Right Column: Move List and Analysis */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <ReviewMoveList
              moves={moves}
              currentIndex={currentIndex}
              onJumpToMove={setCurrentIndex}
            />
            {analysis && (
              <>
                <AnalysisPanel
                  analysis={analysis}
                  isDisabled={true}
                  isThinking={false}
                  onAnalyze={() => {}} // Disabled in review mode
                />
                <AIAnalysisPanel
                  explanation={explanation}
                  error={aiError}
                  isDisabled={false}
                  isGenerating={isGeneratingAi}
                  onExplain={handleExplain}
                  onStyleChange={handleStyleChange}
                  style={aiStyle}
                />
              </>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
