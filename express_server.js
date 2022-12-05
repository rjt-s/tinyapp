const express = require('express');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
const cookieParser = require("cookie-parser");
// const cookieSession = require('cookie-session');
app.use(cookieParser());
// app.use(cookieSession({
//   name: 'session',
//   keys: ['user_id']
// }))
app.use(express.urlencoded({ extended: true }));
const bcrypt = require('bcryptjs');
const getUserByEmail = require('./helpers');

// url database object
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// creating a user object
const users  = {};

// generating a random alphanumeric string of length 6
const selectionArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', 
'9'];

// helper functions
function generateRandomString() {
  let randomStr = '';
  for(let i = 1; i <= 6; i++) {
    let randomIndex = Math.floor(Math.random()*62);
    randomStr += selectionArr[randomIndex];
  };
  return randomStr;
};

function checkUserEmail(mail) {
  const objArr = Object.values(users);
  for(let obj of objArr) {
    if (mail === obj['email']) {
      return true;
    }
  }
  return false;
}

function checkPassword(mail,password) {
  const objArr = Object.values(users);
  for (let obj of objArr) {
    if (mail === obj['email']) {
      console.log(password, 'password');
      console.log(obj['password'], '2 password');
      if (bcrypt.compareSync(password, obj['password'])) {
        return true;
      }
    }
  }
  return false;
}

function urlsForUser(id) {
  const filteredURLDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]['userID'] === id) {
      filteredURLDatabase[key] = urlDatabase[key]['longURL'];
    }
  }
  return filteredURLDatabase;
}

// function getUserIDFromTiny(ID) {
//   for (let key in urlDatabase) {

//     console.log(urlDatabase[key]['userID'], 'urlD');
//     if (urlDatabase[ID]['userID'] === req.cookie['user_id']) {
//       return key;
//     }
//   }
//   return 0;
// }

// Handling GET requests
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
 });

app.get('/urls', (req, res) => {
  // console.log(users);
  // console.log(req.cookies['user_id']);
  const ID = req.cookies['user_id'];

  const templateVars = {urls : urlsForUser(ID), user: users[ID]};
  if (!req.cookies['user_id']) {
    res.status(404);
    res.send('<h2>Register or Login first</h2>')
  } else {
    res.render('urls_index', templateVars);
  }
});

app.get('/login', (req, res) => {
  
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    const ID = req.cookies['user_id']
    const refinedURLDatabase = urlsForUser(ID)
    const templateVars = {urls : refinedURLDatabase, user : users[ID]};
    res.render('login',templateVars);
  }
})

app.get('/urls/new', (req, res) => {
  // console.log('from urls/new', users[req.cookies['user_id']]);
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (!req.cookies['user_id']) {
    res.redirect('/login')
  } else {
  res.render('urls_new',templateVars);
  }
});

app.get('/urls/:id', (req, res) => {

  if(!req.cookies['user_id']) {
    res.send('Please login or register first!')
  } else {
    const templateVars = {id : req.params.id, longURL : urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
    res.render('urls_show', templateVars);
  };
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(404)
    res.send("<h2>Short URL does not exists</h2>")
  } else {
  res.redirect(longURL);
  }
});

app.get('/register', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
  res.render('register',templateVars);
  }
});

app.get('/urls_new', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  res.render('urls_new',templateVars);
});

// POST requests

app.post('/urls', (req, res) => {
  const val = req.body.longURL;
  const key = generateRandomString();
  const userID = req.cookies['user_id'];
  urlDatabase[key] = {longURL: val, userID: userID};
  console.log("running urldatabase");
  console.log(urlDatabase);
  res.redirect(`/urls/${key}`)
})

app.post('/urls/:id/delete', (req, res) => {
  
  let id = req.params.id;
  let userID = req.cookies['user_id'];

  if(!id) {
    res.send('User ID does not exist');
  };

  if (!userID) {
    res.send('Please login first');
   };

  if (userID !== urlDatabase[id]['userID']) {
    res.send('Incorrect owner of URL');
  };
  const ID = req.params.id;
  delete urlDatabase[ID];
  res.redirect('/urls');
})

app.post('/urls/:id', (req, res) => {

  let id = req.params.id;
  let userID = req.cookies['user_id'];

  if(!id) {
    res.send('User ID does not exist');
  };

  if (!userID) {
    res.send('Please login first');
   };

  if (userID !== urlDatabase[id]['userID']) {
    res.send('Incorrect owner of URL');
  };

  const ID = req.params.id;
  const newURL = req.body.updatedLongURL;
  urlDatabase[ID] = newURL;
  res.redirect('/urls');
})

app.post('/login', (req, res) => {
  // res.cookie('username', req.body.username);
  // res.cookie('user_id', req.body.user_id);
  if (!checkUserEmail(req.body.email)) {
    res.status(403);
    res.send('<h2>403 Error</h2><p>Email not found</p>')
  } else {
    if (!checkPassword(req.body.email, req.body.password)){
      res.status(403);
      res.send('<h2>403 Error</h2><p>Wrong Password</p>')
    } else {
      for (key in users) {
        if(users[key]['email'] === req.body.email) {
          res.cookie('user_id', key);
        }
        res.redirect('/urls');
      }
    }
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.post('/register', (req, res) => {
  const emailID = req.body.email;
  const password = req.body.password;
  if (emailID === '' || password === '') {
    res.status(400);
    res.send("<h2>400 Error</h2><p>Please fill username and password</p>");
  } else if (checkUserEmail(req.body.email)) {
    res.status(400);
    res.send('<h2>400 Error</h2><p>Email already registered<p>');
  } else {
    const userID = generateRandomString();
    const hPassword = bcrypt.hashSync(password, 10);
    users[userID] = {id: userID, email: emailID, password: hPassword};
    res.cookie('user_id', userID);
    res.redirect('/urls');
    console.log(users);
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});




