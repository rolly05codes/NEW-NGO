const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Create blog post
router.post('/', async (req, res) => {
  try {
    const { title, content, category, author, excerpt, tags } = req.body;

    const blog = new Blog({
      title,
      content,
      category,
      author,
      excerpt,
      tags,
      status: 'published'
    });

    await blog.save();
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
