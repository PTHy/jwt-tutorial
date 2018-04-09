const User = require('../../../models/user')
const jwt = require('jsonwebtoken')
/*
    POST /api/auth/register
    {
        username,
        password
    }
*/
exports.register = (req, res) => {
    const {username, password} = req.body
    let newUser = null

    //create a new user if does not exist
    const create = (user) => {
      if(user) {
        throw new Error('username exists')
      }else {
        return User.create(username,password)
      }
    }

    //count the number of the user
    const count = (user) => {
      newUser = user
      return User.count({}).exec()
    }

    const assign = (count) => {
      if(count === 1) {
        return newUser.assignAdmin()
      }else {
        //if not, return a promise that returns false
        return Promise.resolve(false)
      }
    }

    //respond to the client
    const respond = (isAdmin) => {
      res.json({
        message : 'registered successfully',
        admin: isAdmin ? true : false
      })
    }

    //run when there is an error (username exists)
    const onError = (error) => {
      res.status(409).json({
        message: error.message
      })
    }

    // check username duplication
    User.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError)
}
/*
  Login Router
*/
exports.login = (req,res) => {
  const {username, password} = req.body
  const secret = req.app.get('jwt-secret')

  //chkeck the user info & generate the jwt
    //chkeck the user info & generate the jwt
  const check = (user) => {
    if(!user) {
      //user dose not exist
      throw new Error('login failed')
    } else {
      //user exits, check the password
      if(user.verify(password)) {
        //create a promise the generates jwt asynchronously
        const p = new Promise((resolve, reject) => {
          jwt.sign(
            {
              _id : user._id,
              username: user.username,
              admin: user.admin
            },
            secret,
            {
              expiresIn: '7d',
              issuer: 'velopert.com',
              subject: 'userInfo'
            }, (err, token) => {
              if(err) reject(err)
              resolve(token)
            }
          )
        })
        return p
      } else {
        throw new Error ('login failed')
      }
    }
  }

  //respond the token
  const respond = (token) => {
    res.json({
      message: 'logged in successfully',
      token
    })
  }

  //error occured
  const onError = (error) => {
    res.status(403).json({
      message: error.message
    })
  }

  //find the user
  User.findOneByUsername(username)
  .then(check)
  .then(respond)
  .catch(onError)
}

/*
  Check Router
*/
exports.check = (req, res) => {
    res.json({
      success: true,
      info: req.decoded
    })
}
