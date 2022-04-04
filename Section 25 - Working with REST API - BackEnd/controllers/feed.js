const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
//* http method and the name
exports.getPosts = (req, res, next) => {
    Post.find()
    .then(posts => {
        res.status(200).json({ message: 'Fetched posts successfully.', posts: posts})
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
    //* return a response in JSON format
    /*res.status(200).json({
        posts: [
            {
                _id: '1',
                title: 'First Post', 
                content: 'This is the First post!', 
                imageUrl:  'images/duck.jpg',
                creator: {
                    name: 'David',
                },
                createdAt: new Date().toLocaleDateString()
            }
        ]
    });*/
};

//* In sync code we can throw errors with throw and it will find the error handler
//* In async code we can throw errors with next and it will find the middleware to handle errors
//* Success resource was created
exports.createPost = (req, res, next) => {
    //* validate errors with express-validator
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    //* validate errors with express-validator

    if(!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    //* path is generated by multer
    const imageUrl = req.file.path.replace("\\" ,"/");
    //* Create a post
    const title = req.body.title;
    const content = req.body.content;
    //* Create a new post using mongoDb and the model
    const post = new Post({ 
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: {
            name: 'David' 
        }
    });
    //* method save provided by mongoose to save data into the data base
    post.save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: 'Post created successfully',
            post: result
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.getPost = (req, res, next) => {
    //* to get a parameter in the url /post/:postId
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Post fetched.', post: post });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file) {
        //imageUrl = req.file.path;
        imageUrl = req.file.path.replace("\\","/");
    }
    if(!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
    .then(post => {
        if(!post) {
            const error = new Error('Could not finf post.');
            error.statusCode = 404;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    })
    .then(result => {
        res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}