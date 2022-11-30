const express = require('express');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

// url database object
const urlDatabase = {
  'b2xVn2' : 'http://www.lighthouselabs.ca',
  '9sm5xK' : 'http://www.google.com'
};

// generating a random alphanumeric string of length 6
const selectionArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', 
'9'];

function generateRandomString() {
  let randomStr = '';
  for(let i = 1; i <= 6; i++) {
    let randomIndex = Math.floor(Math.random()*62);
    randomStr += selectionArr[randomIndex];
  };
  return randomStr;
};

app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
 }
)

app.get('/urls', (req, res) => {
  const templateVars = {urls : urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
})

app.get('/urls/:id', (req, res) => {
  const templateVars = {id : req.params.id, longURL : urlDatabase[req.params.id]};
  res.render('urls_show', templateVars);
})

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
})

app.post('/urls', (req, res) => {
  const val = req.body.longURL;
  const key = generateRandomString();
  urlDatabase[key] = val;
  console.log(urlDatabase);
  res.redirect(`/urls/${key}`)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});




