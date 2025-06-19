import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReviewModal } from "./ReviewModal";

interface TaskCompletionModalProps {
  taskId: string;
  onClose: () => void;
}

export function TaskCompletionModal({ taskId, onClose }: TaskCompletionModalProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    name: string;
    type: "helper_to_seeker" | "seeker_to_helper";
  } | null>(null);

  const task = useQuery(api.tasks.getTaskById, { taskId: taskId as any });
  const currentUser = useQuery(api.users.getCurrentUser);
  const taskReviews = useQuery(api.reviews.getTaskReviews, { taskId: taskId as any });

  if (!task || !currentUser) {
    return null;
  }

  const isSeeker = task.seekerId === currentUser._id;
  const isHelper = task.helperId === currentUser._id;
  
  // Check if current user has already reviewed
  const hasReviewed = taskReviews?.some(review => review.reviewerId === currentUser._id);

  const handleReviewClick = () => {
    if (isSeeker && task.helper) {
      setReviewTarget({
        id: task.helperId!,
        name: task.helper.name,
        type: "seeker_to_helper"
      });
    } else if (isHelper && task.seeker) {
      setReviewTarget({
        id: task.seekerId,
        name: task.seeker.name,
        type: "helper_to_seeker"
      });
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = () => {
    setShowReviewModal(false);
    setReviewTarget(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Task Completed!
            </h2>
            <p className="text-gray-600">
              Great job! The task "{task.title}" has been marked as completed.
            </p>
          </div>

          <div className="space-y-4">
            {/* Points Earned (for helper) */}
            {isHelper && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <div className="text-center">
                    <p className="font-semibold text-green-800">
                      You earned {task.rewardPoints} points!
                    </p>
                    <p className="text-sm text-green-600">
                      Keep helping to earn more rewards
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Leave a Review</h3>
              {hasReviewed ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    ✓ You've already reviewed this task. Thank you for your feedback!
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-3">
                    Help build trust in the community by sharing your experience.
                  </p>
                  <button
                    onClick={handleReviewClick}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600"
                  >
                    {isSeeker ? `Review ${task.helper?.name}` : `Review ${task.seeker?.name}`}
                  </button>
                </div>
              )}
            </div>

            {/* Existing Reviews */}
            {taskReviews && taskReviews.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Reviews</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {taskReviews.map((review) => (
                    <div key={review._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {review.reviewerName}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-xs">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showReviewModal && reviewTarget && (
        <ReviewModal
          taskId={taskId}
          revieweeId={reviewTarget.id}
          revieweeName={reviewTarget.name}
          reviewType={reviewTarget.type}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTarget(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
}
