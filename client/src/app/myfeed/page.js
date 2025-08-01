'use client';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

export default function MyFeed() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileId, setProfileId] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);


    useEffect(() => {
        // First fetch the profile ID
        fetchProfileId();
    }, []);

    useEffect(() => {
        // Then fetch posts when profileId is available
        if (profileId !== null) {
            fetchPosts();
        }
    }, [profileId]);

    const fetchProfileId = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/profile/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch profile ID');

            const data = await response.json();
            setProfileId(data.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/profile/${profileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch posts');

            const data = await response.json();
            setPosts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profileId: profileId,
                    content: postContent,
                }),
            });

            if (!response.ok) throw new Error('Failed to create post');

            setIsModalOpen(false);
            setPostContent('');
            fetchPosts(); // Refresh the posts list
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Loading posts...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="myfeed-container">
            <h1>My Feed</h1>

            <button
                onClick={() => setIsModalOpen(true)}
                className="create-post-button"
            >
                Create Post
            </button>

            {/* Posts List */}
            <div className="posts-list">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="post-card">
                            <p className="post-content">{post.content}</p>
                            <div className="post-meta">
                                <span>{new Date(post.createdAt).toLocaleString()}</span>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="post-tags">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No posts yet. Create your first post!</p>
                )}
            </div>

            {/* Create Post Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                className="post-modal"
                overlayClassName="modal-overlay"
            >
                <h2>Create New Post</h2>
                <form onSubmit={handleSubmit}>
          <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="post-textarea"
              required
          />
                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit">Post</button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
        .myfeed-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
        }
        
        .create-post-button {
          padding: 0.75rem 1.5rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 2rem;
        }
        
        .posts-list {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .post-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .post-content {
          margin: 0;
          line-height: 1.6;
        }
        
        .post-meta {
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .post-tags {
          display: flex;
          gap: 0.5rem;
        }
        
        .tag {
          background: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        /* Modal styles remain the same as previous example */
        .post-modal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .post-textarea {
          width: 100%;
          min-height: 150px;
          padding: 1rem;
          margin: 1rem 0;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        
        .modal-actions button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .modal-actions button[type="button"] {
          background-color: #e2e8f0;
        }
        
        .modal-actions button[type="submit"] {
          background-color: #3b82f6;
          color: white;
        }
        
        .loading, .error {
          text-align: center;
          padding: 2rem;
        }
        
        .error {
          color: #ef4444;
        }
      `}</style>
        </div>
    );
}