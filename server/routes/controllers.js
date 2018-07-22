'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const config = require('./../envConfig');

class BasicController {
  
  constructor(dbConnection) {
    this.connection = dbConnection
    this.models = this.connection.models;
  };

  test() {
    return (req, res) => {
      console.log(req.body);
      res.json({msg:' connect EXPO!'});
    }
  };

  folder() {
    return async ({ params }, res) => {
      if (params) {
        try {
          const searchedFolderObject = await this.models.Folder.findOne({ hash: params.folderHash }).exec();
          res.status(200);
          res.json(searchedFolderObject);
        } catch(error) {
          console.log(error)
        }

      }
    }
  }

  addFirstCommentToPicture() {
    return async ({ params, body }, res) => {
      if (params && body.fileHash) {
        try {
          const searchedFolderObject = await this.models.Folder.findOne({ hash: params.folderHash }).exec();
          let indexToSave;

          searchedFolderObject.contains.forEach((file, index) => {
            file.hash === body.fileHash && !file.commentFlow
              ? indexToSave = index
              : null
          })

          if (indexToSave) {
            const newCommentFLow = await new this.models.CommentFlow({
              comments: [{
                id: new mongoose.mongo.ObjectId(),
                text: body.text,
                user: body.user,
                date: new Date(),
              }], 
              belongsTo: searchedFolderObject.contains[indexToSave].hash,
            }).save()

          searchedFolderObject.contains[indexToSave].commentFlow = newCommentFLow._id;

          searchedFolderObject.markModified('contains');
          await searchedFolderObject.save();
          res.status(200).json({msg: "created new CommentFlow"});
          } else {
            res.status(304).send();
          }
          

        } catch(error) {
          console.log(error)

        }
      }
    }
  }

  addToCommentFlow() {
    return async ({ body, params }, res) => {
      if (params && body.text && body.user) {
        try {
          const commentFlow = await this.models.CommentFlow.findById(params.commentFlowId).exec();
          const newComment = {
            id: new mongoose.mongo.ObjectId(),
            text: body.text,
            user: body.user,
            date: new Date(),
          }
          commentFlow.comments.push(newComment);
          commentFlow.markModified('comments');
          await commentFlow.save();
          res.status(200).json({msg: "added comment to commentFLow"});

        } catch(error) {
          console.log(error)
        }
      }
    }
  }

  getCommentFlow() {
    return async({ body, params }, res) => {
      if (params) {
        try {
          const commentFlow = await this.models.CommentFlow.findById(params.commentFlowId).exec();
          res.status(200).json(commentFlow);
        } catch(error) {
          console.log(error)
        }
      }
    }
  }


  createTag() {
    return async({ body, params }, res) => {
      const { folderHash } = params;
      const { name, reference, originalAuthor } = body;
      try {
        const tag = new this.modesl.Tag({ name, refersTo: [ reference ], originalAuthor });
        await tag.save();

        const folder = await this.models.Folder.findOne({ hash: folderHash }).exec();

        let indexToUpdate;
        folder.contains.forEach((file, index) => {
          file.hash === reference.fileHash
            ? indexToUpdate = index
            : null
        })

        folder.contains[indexToUpdate].tags.push(tag.name)
        folder.markModified('contains');
        await folder.save();
        res.status(200).json('created');
      } catch(error) {
        console.log(error)
      }
    }
  }

  insertIntoTag() {
    return async({ body, params }, res) => {
      const { folderHash } = params;
      const { name, reference } = body;
      try {
        const existingTag = await Tag.findOne({ name }).exec();

        let unique = true;
        existingTag.refersTo.forEach((filereference) => filereference.fileHash === reference.fileHash ? unique = false : null)

        if (unique) {
          existingTag.refersTo.push(reference);
          existingTag.markModified('refersTo');

          
          const folder = await this.models.Folder.findOne({ hash: folderHash }).exec();

          let indexToUpdate;
          folder.contains.forEach((file, index) => {
            file.hash === reference.fileHash
              ? indexToUpdate = indexToUpdate
              : null
          })

          folder.contains[indexToUpdate].tags.push(existingTag.name)
          folder.markModified('contains');

          await existingTag.save();
          await folder.save();
          res.status(200).json('created');
        } else {
          console.log('already referenced')
        }
      } catch(error) {
        console.log(error)
      }
    }
  }

  getSpecificTagsReferences() {
    return async({ body }, res) => {
      // @TODO
    }
  }

  getTags() {
    return async({ body }, res) => {
      // @TODO
    }
  }
  
  admin() {
    return (req, res) => {
      if (req.headers.adminpassword === config.ADMIN_PASSWORD) {
        console.log('/admin BODY :\n', req.body);
        if (req.body.hasOwnProperty('Command')) {
          switch(req.body.Command) {
            case 'list':
              console.log('FIND ALL USER');
              this.models.User.find()
              .then(users => res.json(users.map(user => {
                return {
                  "username": user.username,
                  "enabled": user.enabled,
                }
              })));
              break;
            case 'add':
              if (req.body.Username && req.body.Password) {
                this.models.User.findOne({username: req.body.Username})
                .then(user => {
                  res.json({msg: `User: ${user.username} already exists`});
                })
                .catch(err => {
                  bcrypt.hash(req.body.Password, saltRounds, (err, hash) => {
                    if (err) {
                      console.log('ERROR', err);
                    } else {
                      const myHash = hash;
                      let user_ = new this.models.User({
                        username: req.body.Username,
                        password: myHash,
                        enabled: true,
                      });
                      user_.save()
                      .then(() => res.json({ msg: `User created: ${req.body.Username}` }))
                      .catch(err => {
                        res.json({ msg: 'cannot save to DB'});
                      });
                    }
                  });                  
                });
              } else {
                res.json({ msg: "no username or password provided"});
              }
              break;
            default:
              res.json({ msg: 'no valid command issued'});
          }
        } else {
          res.json({ msg: 'no command issued'});
        }
      } else {
        res.json({msg: 'you have no rights to do this'})
      }
    };
  };

  auth() {
    return (req, res) => {      
      if ((req.body.username.length > 0) && (req.body.password.length > 0)) {
        this.models.User.findOne({ username: req.body.username })
        .then((user) => {
          console.log('USER ???', user);
          bcrypt.compare(req.body.password, user.password, function(err, hashReturn) {
            if (err) {
              console.log('HASH ERROR', err);
            } else {
              if (hashReturn) {
                req.session.authenticated = true;
                req.session.userID = user.id;
                res.json({ Success: 'Successfully authenticated' });
              } else {
                res.json({ Error: 'wrong password' });
              }
            }
          });
        }).catch(err =>
          res.json({ Error: 'User not found' })
        );
      } else {
        res.json({ Error: 'no username and/or Password provided' });
      }
    };
  };

  root() {
    return (req, res) => {
      if (req.session.authenticated) {
        res.render('home');
      } else {
        res.render('login');
      }
    };
  };

  home() {
    return (req, res) => {
      res.render('home');
    };
  };

  ribbit() {
    return (req, res) => {
      res.render('ribbit');
    };
  };

  drive() {
    return (req, res) => {
      res.render('drive');
    };
  };

  games() {
    return (req, res) => {
      res.render('games');
    };
  };

  options() {
    return (req, res) => {
      this.models.User.findOne({ _id: req.session.userID }).then(user => {
        res.render('options', { username: user.username });
      });
    };
  };
};

module.exports = BasicController;
