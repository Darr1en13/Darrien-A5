//DARRIEN SMITH
const express = require('express');
const app = express();

var mysql = require('mysql');

const bcrypt = require('bcrypt');

const conInfo = 
{
    host: process.env.IP,
    user: process.env.C9_USER,
    password: "",
    database: "SONGSDB"
};

var session = require('express-session'); 
app.use(session({ secret: 'happy jungle', 
                  resave: false, 
                  saveUninitialized: false, 
                  cookie: { maxAge: 600000 }}));

app.all('/', whoIsLoggedIn);                  
app.all('/register', register);
app.all('/login', login);
app.all('/logout', logout);
app.all('/listSongs', listSongs);
app.all('/addSong', addSong);
app.all('/removeSong', removeSong);
app.all('/clearSongs', clearSongs);


var id;


app.listen(process.env.PORT,  process.env.IP, startHandler());

function startHandler()
{
  console.log('Server listening on port ' + process.env.PORT)
}

function whoIsLoggedIn(req, res)
{
  if (req.session.user == undefined)
    writeResult(req, res, {'result' : 'Nobody is logged in.'});
  else
  {
    writeResult(req, res, req.session.user);
  }
}

function register(req, res)
{
  if (req.query.email == undefined || !validateEmail(req.query.email))
  {
    writeResult(req, res, {'error' : "Please specify a valid email"});
    return;
  }

  if (req.query.password == undefined || !validatePassword(req.query.password))
  {
    writeResult(req, res, {'error' : "Password must have a minimum of eight characters, at least one letter and one number"});
    return;
  }

  var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      // bcrypt uses random salt is effective for fighting
      // rainbow tables, and the cost factor slows down the
      // algorithm which neutralizes brute force attacks ...
      let hash = bcrypt.hashSync(req.query.password, 12);
      con.query("INSERT INTO USERS (USR_EML, USR_PSW) VALUES (?, ?)", [req.query.email, hash], function (err, result, fields) 
      {
        if (err) 
        {
          if (err.code == "ER_DUP_ENTRY")
            err = "User account already exists.";
          writeResult(req, res, {'error' : err});
        }
        else
        {
          con.query("SELECT * FROM USERS WHERE USR_EML = ?", [req.query.email], function (err, result, fields) 
          {
            if (err) 
              writeResult(req, res, {'error' : err});
            else
            {
              req.session.user = {'result' : {'id': result[0].USR_ID, 'email': result[0].USR_EML}};
              id = result[0].USR_ID;

              writeResult(req, res, req.session.user);
            }
          });
        }
      });
    }
  });
  
}

function login(req, res)
{
  if (req.query.email == undefined)
  {
    writeResult(req, res, {'error' : "Email is required"});
    return;
  }

  if (req.query.password == undefined)
  {
    writeResult(req, res, {'error' : "Password is required"});
    return;
  }
  
  var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      con.query("SELECT * FROM USERS WHERE USR_EML = ?", [req.query.email], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
        {
          if(result.length == 1 && bcrypt.compareSync(req.query.password, result[0].USR_PSW))
          {
            req.session.user = {'result' : {'id': result[0].USR_ID, 'email': result[0].USR_EML}};
            id = result[0].USR_ID;
            writeResult(req, res, req.session.user);
          }
          else 
          {
            writeResult(req, res, {'error': "Invalid email/password"});
          }
        }
      });
    }
  });
}

function logout(req, res)
{
  req.session.user = undefined;
  writeResult(req, res, {'result' : 'Nobody is logged in.'});
}

function writeResult(req, res, obj)
{
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(obj));
  res.end('');
}

function validateEmail(email) 
{
  if (email == undefined)
  {
    return false;
  }
  else
  {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
}

function validatePassword(pass)
{
  if (pass == undefined)
  {
    return false;
  }
  else
  {
    var re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return re.test(pass);
  }
}

function listSongs(req,res)
{
  
  if (req.session.user == undefined)
    writeResult(req, res, {'result' : 'You need to log in to list songs'});
    else
    {
  var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(res, {'error' : err});
    else
    {
      con.query("SELECT * FROM SONGS WHERE USR_ID=?",[id], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
         // writeResult(req, res, {'result' : {'SONG_ID':result[0].SNG_ID ,'USER_ID':result[0].USR_ID,'SONG_NAME':result[0].SNG_NAME }});
            
            writeResult(req,res,{'result':result});
            //console.log(result.length);
      }); 
   
    }
  });
  }
}

function addSong(req,res)
{
 
 if (req.session.user == undefined)
    writeResult(req, res, {'result' : 'You need to log in to add songs'});
  else
  {
  
    var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      con.query('INSERT INTO SONGS(SNG_NAME,USR_ID) VALUES (?,?)',[req.query.song,id], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
         // writeResult(req, res, {'Message' : ` Song ${req.query.song} has been archived`});
         listSongs(req,res);
      });
    }
  });
    
  }

}

function removeSong(req,res)
{
if (req.session.user == undefined)
    writeResult(req, res, {'result' : 'You need to log in to remove songs'});
  else
  {
  
    var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      con.query('DELETE FROM SONGS WHERE SNG_NAME = ?',[req.query.song], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
         // writeResult(req, res, {'Message' : ` Song ${req.query.song} has been archived`});
         listSongs(req,res);
      });
    }
  });
    
  } 
}

function clearSongs(req,res)
{
if (req.session.user == undefined)
    writeResult(req, res, {'result' : 'You need to log in to clear songs'});
  else
  {
  
    var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      con.query('DELETE FROM SONGS WHERE USR_ID = ?',[id], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
         // writeResult(req, res, {'Message' : ` Song ${req.query.song} has been archived`});
         listSongs(req,res);
      });
    }
  });
    
  }     

}
