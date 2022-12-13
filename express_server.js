// installing app requirements

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
// const getUserByEmail = require('./helpers');

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

function getUserByEmail(email) {
  const userArray = Object.values(users);
  for(let user of userArray) {
    if (email === user.email) {
      return user;
    }
  }
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

// helper function : check if url for a particular id exists

function idExists(id) {
  for(let key in urlDatabase) {
    if (key === id) {
      return true;
    }
  }
  return false;
}

// helper function : check if the provided user owns the url

function checkURLOwner(userID, urlID) {
  return urlDatabase[urlID]['userID'] === userID;
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

// Routes
// Handling GET requests
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

app.get('/urls', (req, res) => {
  const ID = req.cookies['user_id'];
  if (!req.cookies['user_id']) {
    return res.send('Please login first to view this page')
  } else {
    const templateVars = {urls : urlsForUser(ID), user: users[ID]};
    return res.render('urls_index', templateVars);
  }
});

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

app.get('/urls/new', (req, res) => {
  // console.log('from urls/new', users[req.cookies['user_id']]);
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (!req.cookies['user_id']) {
    return res.redirect('/login')
  } else {
    return res.render('urls_new',templateVars);
  }
});

app.get('/urls/:id', (req, res) => {

  if(!req.cookies['user_id']) {
    return res.send('Please login or register first!')
  } else if(!(idExists(req.params.id))) {
    // console.log(req.params.id, 'line156');
    return res.send('No URL exists for this id');
  } else if (!checkURLOwner(req.cookies['user_id'], req.params.id)) {
    return res.send('Access denied, the url is not created by you');
  } else {
    const templateVars = {id : req.params.id, longURL : urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
    // console.log(urlDatabase[req.params.id], 'line146');
    return res.render('urls_show', templateVars);
  };
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id]['longURL'];
  if (!longURL) {
    return res.send("<h2>Short URL does not exists</h2>")
  } else {
    return res.redirect(longURL);
  }
});

app.get('/register', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  } else {
    return res.render('register',templateVars);
  }
});

app.get('/urls_new', (req, res) => {
  const templateVars = {urls : urlDatabase, user : users[req.cookies['user_id']]};
  return res.render('urls_new',templateVars);
});

// POST requests

app.post('/urls', (req, res) => {
  const val = req.body.longURL;
  const key = generateRandomString();
  const userID = req.cookies['user_id'];
  urlDatabase[key] = {longURL: val, userID: userID};
  // console.log("running urldatabase");
  // console.log(urlDatabase);
  return res.redirect(`/urls/${key}`)
})

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

app.post('/urls/:id', (req, res) => {

  let id = req.params.id;
  let userID = req.cookies['user_id'];
  // console.log(id, 'line 212');
  // console.log(userID, 'line 213');
  // console.log(urlDatabase, 'line 214');

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

app.post('/login', (req, res) => {
  console.log('body', req.body);
  // res.cookie('username', req.body.username);
  // res.cookie('user_id', req.body.user_id);
  const user = getUserByEmail(req.body.email, users);
  console.log('user',user);
  // console.log(users);

  if(!user) {
    return res.send("User not found");
  }
  
  console.log('bcrypt',req.body.password, user.password);
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.send('Wrong Passowrd');
  } 

  res.cookie('user_id', user.id);
  res.redirect('/urls');


  // if (!getUserByEmail(req.body.email)) {
  //   return res.send('<h2>403 Error</h2><p>Email not found</p>')
  // } else {
  //   if (!checkPassword(req.body.email, req.body.password)){
  //     console
  //     return res.send('<h2>403 Error</h2><p>Wrong Password</p>')
  //   } else {
  //     for (key in users) {
  //       if(users[key]['email'] === req.body.email) {
  //         res.cookie('user_id', key);
  //         return res.redirect('/urls');
  //       }
  //       console.log('error occured, line 268');
  //       res.redirect('/urls');
  //     }
  //   }
  // }
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/login');
})

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
    console.log(users);
    return res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});




