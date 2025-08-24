import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Comments({ postId }) {
    const [comments, setComments] = useState([]);
    const [tree, setTree] = useState([]);

    useEffect(() => {
        (async () => {
            const res = await api.get(`/comments/post/${postId}`);
            setComments(res.data.comments || []);
        })();
    }, [postId]);

    useEffect(() => {
        // build tree from flat list
        const map = {};
        comments.forEach(c => map[c._id] = { ...c, children: [] });
        const roots = [];
        comments.forEach(c => {
            if (c.parentComment) {
                if (map[c.parentComment]) map[c.parentComment].children.push(map[c._id]);
            } else roots.push(map[c._id]);
        });
        setTree(roots);
    }, [comments]);

    return (
        <div className="space-y-4">
            {tree.map(node => <CommentNode key={node._id} node={node} />)}
        </div>
    );
}

function CommentNode({ node }) {
    return (
        <div className="pl-4 border-l">
            <div className="text-sm"><strong>{node.author.name}</strong> <span className="text-gray-500 text-xs">{new Date(node.createdAt).toLocaleString()}</span></div>
            <div>{node.content}</div>
            {node.children?.map(child => <CommentNode key={child._id} node={child} />)}
        </div>
    );
}
