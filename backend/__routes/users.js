const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../__config/database')
const User = require('../__models/user');

router.get('/', (req, res) => {
    User.find()
        .then(user => res.json(user))
});

router.get('/', (req, res) => {
    User.find()
        .then(user => res.json(user))
});

//This function is use for user registration
//It requests the field as a JSON type
//Then it adds the into the database as a new collection
router.post('/register', (req, res, next) => {

    
                        //First, Initialize the input that has been entered as a new user
                        let newUser = new User({
                            f_name: req.body.f_name,
                            l_name: req.body.l_name,
                            email: req.body.email.toLowerCase(),
                            username: req.body.username.toLowerCase(),
                            password: req.body.password,
                            usertype: req.body.usertype,
                        });

        
    //Then, Add the user to the database using a method defined in user model
    //If, there is an error in the database, provide error message
    //else, user is registered
    User.addUser(newUser, (err) => {
        if (err) {
            if (err.code === 11000) {
                res.json({ success: false, message: 'Username or Email already Exists' });
            } else if (err.errors) {
                if (err.errors.email) {
                    res.json({ success: false, message: err.errors.email.message });
                } else if (err.errors.username) {
                    res.json({ success: false, message: err.errors.username.message });
                } else if (err.errors.password) {
                    res.json({ success: false, message: err.errors.password.message });
                } else {
                    res.json({ success: false, message: 'Failed to register user. Error: ', err });
                }
            }
        } else {
            res.json({ success: true, message: 'Successfully registered account' });
        }
    })
})



//This function is to authenticate that this is the real user that has been registered
//It checks if the email address and password match the collection
//If it does, provide a token that allows access
router.post('/authenticate', (req, res, next) => {

    //Get the email and password as JSON type
    const email = req.body.email;
    const password = req.body.password;

    //Verifies the user email address with the database collection
    //If not found, throw err
    User.getUserByEmailAddress(email, (err, user) => {
        if (err) throw err;
        if (!user) {
            return res.json({ success: false, message: 'Username or Password is incorrect' });
        }

        // Verification of password if it match
        // If there is an error, throw err
        // If it match, allow them to access for 1 week
        // Provide the bearer token for access
        // If the password does not match, provide acknowledgement that the password is wrong
        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                const token = jwt.sign({ data: user }, config.secret, {
                    expiresIn: 604800 // after not logging in for 1 week
                });

                res.json({
                    success: true,
                    token: `Bearer ${token}`,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            } else {
                return res.json({ success: false, message: 'Username or Password is incorrect' })
            }
        });
    });
});

//check for email
router.get('/checkEmail/:email', (req, res) => {
    if (!req.params.email) {
        res.json({ success: false, message: 'Email has not been provided' });
    } else {
        User.findOne({ email: req.params.email }, (err, user) => {
            if (err) {
                res.json({ success: false, message: err });
            } else if (user) {
                res.json({ success: false, message: 'E-mail is already registered' });
            } else {
                res.json({ success: true, message: 'E-mail is available' })
            }
        })
    }
})

//check for username
router.get('/checkUsername/:username', (req, res) => {
    if (!req.params.username) {
        res.json({ success: false, message: 'Username has not been provided' });
    } else {
        User.findOne({ username: req.params.username }, (err, user) => {
            if (err) {
                res.json({ success: false, message: err });
            } else if (user) {
                res.json({ success: false, message: 'Username is already registered' });
            } else {
                res.json({ success: true, message: 'Username Available' })
            }

        })
    }
})

//middleware to grab the tokens
// router.use((req, res, next) => {
//     const token = req.headers['Authorization'];
//     if (!token) {
//         res.json({ success: false, message: 'No token provided' });
//     } else {
//         jwt.verify(token, config.secret, (err, decoded) => {
//             if (err) {
//                 res.json({ success: false, message: 'Token invalid: ' + err });
//             } else {
//                 req.decoded = decoded;
//                 next();
//             }
//         });
//     }
// });

//A route way to access the webpage, therefore we have to encrypt with a passport authentication
//If they have the correct authentication(token), therefore it would allow access
//This is just get the user req and goes to authenticate, if authenticate successful
// Allow pass
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.json({ success: true, user: req.user });
});

router.put('/profile/updateProfile', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    User.findOne({ _id: req.body._id }, (err, user) => {
        if (err) {
            res.json({ success: false, message: 'Not a authorized user' });
        } else {
            if (!user) {
                res.json({ success: false, message: 'User not found' });
            } else {
                //admin user?
                // User.findOne({ _id: req.decoded.userId }, (err, user) => {
                //     if (err) {
                //         res.json({ success: false, message: err });
                //     } else {
                //         if (!user) {
                //             res.json({ success: false, message: 'Unable to authenticate user' })
                //         } else {
                //             //only if you havea username ro123, you can update the thing
                //             if (user.username !== "ro123") {
                //                 res.json ({ success: false, message: 'Not authorized to update the subject' })
                //             } else {
                user.f_name = req.body.f_name;
                user.l_name = req.body.l_name;
                user.email = req.body.email.toLowerCase();
                user.username = req.body.username.toLowerCase();
                user.password = req.body.password;

                user.save((err) => {
                    if (err) {
                        res.json({ success: false, message: err });
                    } else {
                        res.json({ success: true, message: 'User Updated Successfully' });
                    }
                });
                //             }
                //         }
                //     }

                // });
            }
        }
    });

})




module.exports = router;
