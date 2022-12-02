const express = require('express');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// url database object
const urlDatabase = {
  'b2xVn2' : 'http://www.lighthouselabs.ca',
  '9sm5xK' : 'http://www.google.com'
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
  const templateVars = {urls : urlDatabase, user: users[req.cookies["user_id"]]};
  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/urls/new', (req, res) => {
  // console.log('from urls/new', users[req.cookies['user_id']]);
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  res.render('urls_new',templateVars);
})

app.get('/urls/:id', (req, res) => {
  const templateVars = {id : req.params.id, longURL : urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
  res.render('urls_show', templateVars);
})

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
})

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/urls_new', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  res.render('urls_new',templateVars);
});

// POST requests

app.post('/urls', (req, res) => {
  const val = req.body.longURL;
  const key = generateRandomString();
  urlDatabase[key] = val;
  res.redirect(`/urls/${key}`)
})

app.post('/urls/:id/delete', (req, res) => {
  const ID = req.params.id;
  delete urlDatabase[ID];
  res.redirect('/urls');
})

app.post('/urls/:id', (req, res) => {
  const ID = req.params.id;
  const newURL = req.body.updatedLongURL;
  urlDatabase[ID] = newURL;
  res.redirect('/urls');
})

app.post('/login', (req, res) => {
  // res.cookie('username', req.body.username);
  // res.cookie('user_id', req.body.user_id);
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
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
    users[userID] = {id: userID, email: emailID, password: password};
    res.cookie('user_id', userID);
    res.redirect('/urls');
    console.log(users);
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});




