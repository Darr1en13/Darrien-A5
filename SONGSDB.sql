DROP DATABASE IF EXISTS SONGSDB;

CREATE DATABASE SONGSDB;

use SONGSDB;

CREATE TABLE USERS(

USR_ID int NOT NULL AUTO_INCREMENT,
USR_EML VARCHAR(255) UNIQUE NOT NULL, 
USR_PSW VARCHAR(255) NOT NULL, 
PRIMARY KEY(USR_ID)
);

CREATE TABLE SONGS(
SNG_ID int NOT NULL AUTO_INCREMENT,
SNG_NAME VARCHAR(255) NOT NULL,
USR_ID int NOT NULL,
PRIMARY KEY(SNG_ID),
FOREIGN KEY(USR_ID) REFERENCES USERS(USR_ID)
);









