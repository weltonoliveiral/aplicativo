import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ReviewModalProps {
  taskId: string;
  revieweeId: string;
  revieweeName: string;
  reviewType: "helper_to_seeker" | "seeker_to_helper";
  onClose: () => void;
  onSubmit: () => void;
}

export function ReviewModal({ 
  taskId, 
  revieweeId, 
  revieweeName, 
  reviewType, 
  onClose, 
  onSubmit 
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReview = useMutation(api.reviews.createReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createReview({
        taskId: taskId as any,
        revieweeId: revieweeId as any,
        rating,
        comment: comment.trim() || undefined,
        reviewType,
      });
      
      toast.success("Review submitted successfully!");
      onSubmit();
      onClose();
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Review {revieweeName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 5 && "Excellent!"}
              {rating === 4 && "Very good"}
              {rating === 3 && "Good"}
              {rating === 2 && "Fair"}
              {rating === 1 && "Poor"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Share your experience..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
