import React from 'react';
import dayjs from 'dayjs';

const StarRating = ({ rating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const CommentCard = ({ review }) => {
    const user = review.user_id || {};
    const authorName = user.username || user.name || 'Khách ẩn danh';
    const avatarUrl = user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const timeDisplay = review.createdAt ? dayjs(review.createdAt).format('DD/MM/YYYY HH:mm') : '';

    return (
        <div className="flex gap-4 p-4 border-b last:border-b-0 bg-white rounded-lg shadow-sm mb-3">
            <img
                src={avatarUrl}
                alt={authorName}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-800">{authorName}</span>
                    <span className="text-xs text-gray-400">{timeDisplay}</span>
                </div>
                <StarRating rating={review.rating} />
                <p className="my-2 text-gray-700">{review.comment}</p>
            </div>
        </div>
    );
};

export default CommentCard;