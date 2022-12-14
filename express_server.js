// installing app requirements

const express = require('express');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const bcrypt = require('bcryptjs');

// const getUserByEmail = require('./helpers');
// app.use(cookieSession({
//   name: 'session',
//   keys: ['user_id']
// }))
// const cookieSession = require('cookie-session');

// url database object : with some prefilled user and data
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

// creating a user object : empty object
const users  = {};

// selector Array to generate a random alphanumeric string of length 6 which will be used to generate random strings for url and userid
const selectionArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', 
'9'];


// helper functions

// generates a random 6 character long alphanumeric string
function generateRandomString() {
  let randomStr = '';
  for(let i = 1; i <= 6; i++) {
    let randomIndex = Math.floor(Math.random()*62);
    randomStr += selectionArr[randomIndex];
  };
  return randomStr;
};

// gets user for a given mail id
function getUserByEmail(email) {
  const userArray = Object.values(users);
  for(let user of userArray) {
    if (email === user.email) {
      return user;
    }
  }
}

// provides urls which belong to the particular user
function urlsForUser(id) {
  const filteredURLDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]['userID'] === id) {
      filteredURLDatabase[key] = urlDatabase[key]['longURL'];
    }
  }
  return filteredURLDatabase;
}

// checks if url for a particular id exists
function idExists(id) {
  for(let key in urlDatabase) {
    if (key === id) {
      return true;
    }
  }
  return false;
}

// checks if the provided user owns the url
function checkURLOwner(userID, urlID) {
  return urlDatabase[urlID]['userID'] === userID;
}


// Routes
// Handling GET requests
// '/' route
app.get('/', (req, res) => {
  if(!req.cookies['user_id']) {
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  return res.json(urlDatabase);
 });

// '/urls' route
app.get('/urls', (req, res) => {
  const ID = req.cookies['user_id'];
  if (!req.cookies['user_id']) {
    return res.send('Please login first to view this page')
  } else {
    const templateVars = {urls : urlsForUser(ID), user: users[ID]};
    return res.render('urls_index', templateVars);
  }
});

// '/login' route
app.get('/login', (req, res) => {
  
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  } else {
    const ID = req.cookies['user_id']
    const refinedURLDatabase = urlsForUser(ID)
    const templateVars = {urls : refinedURLDatabase, user : users[ID]};
    return res.render('login',templateVars);
  }
})

// '/urls/new' route
app.get('/urls/new', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (!req.cookies['user_id']) {
    return res.redirect('/login')
  } else {
    return res.render('urls_new',templateVars);
  }
});


// '/urls/:id' route
app.get('/urls/:id', (req, res) => {

  if(!req.cookies['user_id']) {
    return res.send('Please login or register first!')
  } else if(!(idExists(req.params.id))) {
    return res.send('No URL exists for this id');
  } else if (!checkURLOwner(req.cookies['user_id'], req.params.id)) {
    return res.send('Access denied, the url is not created by you');
  } else {
    const templateVars = {id : req.params.id, longURL : urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
    return res.render('urls_show', templateVars);
  };
});


// '/u/:id' route 
app.get('/u/:id', (req, res) => {
  const id = urlDatabase[req.params.id];
  if (!id) {
    return res.send("<h2>Short URL does not exists</h2>")
  } else {
    return res.redirect(id['longURL']);
  }
});

// '/register' route
app.get('/register', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  } else {
    return res.render('register',templateVars);
  }
});

// '/urls_new' route
app.get('/urls_new', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  return res.render('urls_new',templateVars);
});

// POST requests

// post to '/urls'
app.post('/urls', (req, res) => {
  const val = req.body.longURL;
  const key = generateRandomString();
  const userID = req.cookies['user_id'];

  if(!userID) {
    res.send('Error : please login first');
  }
  urlDatabase[key] = {longURL: val, userID: userID};
  return res.redirect(`/urls/${key}`)
})

// post to 'urls/:id/delete'
app.post('/urls/:id/delete', (req, res) => {
  
  let id = req.params.id;
  let userID = req.cookies['user_id'];

  if(!id) {
    return res.send('User ID does not exist');
  };

  if (!userID) {
    return res.send('Please login first');
   };

  if (userID !== urlDatabase[id]['userID']) {
    return res.send('Incorrect owner of URL');
  };
  const ID = req.params.id;
  delete urlDatabase[ID];
  return res.redirect('/urls');
})

// post to '/urls/:id' 
app.post('/urls/:id', (req, res) => {

  let id = req.params.id;
  let userID = req.cookies['user_id'];

  if(!id) {
    return res.send('User ID does not exist');
  };

  if (!userID) {
    return res.send('Please login first');
   };

  if (userID !== urlDatabase[id]['userID']) {
    return res.send('Incorrect owner of URL');
  };

  const newURL = req.body.updatedLongURL;
  urlDatabase[id]['longURL'] = newURL;
  urlDatabase[id]['userID'] = userID;
  return res.redirect('/urls');
})


// post to '/login'
app.post('/login', (req, res) => {

  const user = getUserByEmail(req.body.email, users);

  if(!user) {
    return res.send("User not found");
  }
  
  // console.log('bcrypt',req.body.password, user.password);
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.send('Wrong Passowrd');
  } 

  res.cookie('user_id', user.id);
  res.redirect('/urls');

})


// post to '/logout'
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/login');
})


// post to '/register'
app.post('/register', (req, res) => {
  const emailID = req.body.email;
  const password = req.body.password;
  if (emailID === '' || password === '') {
    return res.send("<h2>400 Error</h2><p>Please fill username and password</p>");
  } else if (getUserByEmail(req.body.email)) {
    return res.send('<h2>400 Error</h2><p>Email already registered<p>');
  } else {
    const userID = generateRandomString();
    const hPassword = bcrypt.hashSync(password, 10);
    users[userID] = {id: userID, email: emailID, password: hPassword};
    res.cookie('user_id', userID);
    // console.log(users);
    return res.redirect('/urls');
  }
});




// app.listen 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});




