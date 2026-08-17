'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  Award,
  Pin,
  Send,
  Plus,
  Filter,
  Sparkles,
  BookOpen,
  HelpCircle,
  Megaphone,
} from 'lucide-react';
import { createPostAction, createCommentAction, toggleReactionAction } from '../actions';

interface CommunityFeedClientProps {
  initialPosts: any[];
  currentUserId: string;
}

export function CommunityFeedClient({ initialPosts, currentUserId }: CommunityFeedClientProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('GENERAL');
  const [newVisibility, setNewVisibility] = useState('PUBLIC_COMMUNITY');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.postType === activeFilter;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createPostAction({
        content: newPostContent,
        postType: newPostType as any,
        visibility: newVisibility as any,
      });

      if (res.success && res.post) {
        setPosts([res.post, ...posts]);
        setNewPostContent('');
        setShowCreateModal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReaction = async (postId: string, reactionType: string) => {
    try {
      const res = await toggleReactionAction({
        targetType: 'POST',
        targetId: postId,
        postId,
        reactionType: reactionType as any,
      });

      if (res.success) {
        setPosts(
          posts.map((p) => {
            if (p.id !== postId) return p;
            let updatedReactions = [...(p.reactions || [])];
            if (res.action === 'REMOVED') {
              updatedReactions = updatedReactions.filter((r) => r.userId !== currentUserId);
            } else if (res.action === 'ADDED') {
              updatedReactions.push(res.reaction);
            } else if (res.action === 'UPDATED') {
              updatedReactions = updatedReactions.map((r) => (r.userId === currentUserId ? res.reaction : r));
            }
            return { ...p, reactions: updatedReactions };
          })
        );
      }
    } catch (err: any) {
      console.error('Reaction toggle error:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    try {
      const res = await createCommentAction({ postId, content });
      if (res.success && res.comment) {
        setPosts(
          posts.map((p) => {
            if (p.id !== postId) return p;
            return { ...p, comments: [...(p.comments || []), res.comment] };
          })
        );
        setCommentInputs({ ...commentInputs, [postId]: '' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 p-6 rounded-xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-wine-400 text-rose-500" />
            Executive Community Feed
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private organization feed for strategic updates, leadership wins, and team collaboration.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 hover:to-wine-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg shadow-wine-900/30 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Community Post
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {[
          { id: 'ALL', label: 'All Feed', icon: Sparkles },
          { id: 'ANNOUNCEMENT', label: 'Announcements', icon: Megaphone },
          { id: 'TRAINING', label: 'Training', icon: BookOpen },
          { id: 'MOTIVATION', label: 'Motivation', icon: Heart },
          { id: 'ACHIEVEMENT', label: 'Achievements', icon: Award },
          { id: 'QUESTION', label: 'Q&A', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-rose-900/50 text-rose-200 border border-rose-700/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Posts Feed Stream */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-white/5 rounded-xl">
            <Filter className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No community posts match the selected filter.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorName = post.author?.profile?.displayName || post.author?.name || 'Leader';
            const userReaction = post.reactions?.find((r: any) => r.userId === currentUserId);

            return (
              <div
                key={post.id}
                className="bg-slate-900/70 border border-white/10 rounded-xl p-6 shadow-xl space-y-4 hover:border-white/20 transition-all duration-200"
              >
                {/* Author & Header Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-950 to-slate-800 border border-rose-700/40 flex items-center justify-center text-rose-200 font-bold text-sm">
                      {authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{authorName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-800/40 text-rose-300 font-mono">
                          {post.postType}
                        </span>
                        {post.isPinned && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded">
                    {post.visibility}
                  </span>
                </div>

                {/* Content */}
                <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">{post.content}</p>

                {/* Reaction Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/10 text-xs">
                  <button
                    onClick={() => handleToggleReaction(post.id, 'LIKE')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                      userReaction?.reactionType === 'LIKE'
                        ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.reactions?.length || 0} Likes</span>
                  </button>
                  <button
                    onClick={() => handleToggleReaction(post.id, 'LOVE')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Love</span>
                  </button>
                  <button
                    onClick={() => handleToggleReaction(post.id, 'CELEBRATE')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Celebrate</span>
                  </button>
                </div>

                {/* Comments Thread Section */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  {post.comments?.map((comment: any) => (
                    <div key={comment.id} className="bg-slate-950/40 p-3 rounded-lg border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-200">
                          {comment.author?.profile?.displayName || comment.author?.name || 'Member'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300">{comment.content}</p>
                    </div>
                  ))}

                  {/* Add Comment Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-700/60"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-1.5 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Post */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create Community Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Post Type</label>
                <select
                  value={newPostType}
                  onChange={(e) => setNewPostType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                  <option value="TRAINING">TRAINING</option>
                  <option value="MOTIVATION">MOTIVATION</option>
                  <option value="TESTIMONY">TESTIMONY</option>
                  <option value="ACHIEVEMENT">ACHIEVEMENT</option>
                  <option value="QUESTION">QUESTION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Visibility Scope</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="PUBLIC_COMMUNITY">PUBLIC_COMMUNITY (All Members)</option>
                  <option value="TEAM">TEAM (Organization Downlines)</option>
                  <option value="LEADERS_ONLY">LEADERS_ONLY (Admins & Leaders)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Post Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share announcement, testimony, or leadership insights..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs text-white font-medium shadow-md"
                >
                  {isSubmitting ? 'Posting...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
