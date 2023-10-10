
CREATE TABLE users (
    userID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    idFront VARCHAR(255),
    idBack VARCHAR(255),
    verificationImage VARCHAR(255),
    datejoined TIMESTAMP DEFAULT current_timestamp,
    contact_verified BOOLEAN DEFAULT FALSE,
    secret VARCHAR(256) NOT NULL,
    tier VARCHAR(40) DEFAULT 'STARTER',
    email VARCHAR(100),
    contactno VARCHAR(20) NOT NULL,
    nic VARCHAR(12) NOT NULL,
    verification_mode BIT(1),
    admin_verified BOOLEAN DEFAULT FALSE,
    otp BIGINT,
    otp_expiration TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pwd_reset_tokens(
    userid UUID PRIMARY KEY,
    reset_token VARCHAR(10),
    token_expiration TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE user_tokens(
    userid UUID PRIMARY KEY,
    reset_token VARCHAR(10),
    token_expiration TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE ON UPDATE CASCADE
);

create table police_user(
	username bigint,
	password varchar(512) NOT NULL,
	userrole varchar(40) NOT NULL,
	PRIMARY KEY(username),
	FOREIGN KEY(username) REFERENCES police_officer(officerid) ON DELETE CASCADE ON UPDATE CASCADE
);

create table police_user_tokens(
	userid bigint,
	refresh_token varchar(512),
	PRIMARY KEY(userid)
);

create table payment_info(
    payment_id varchar(256) PRIMARY_KEY,
    reference_id varchar(256) NOT NULL,
    amount float NOT NULL,
    currency varchar(10) NOT NULL,
    payment_status int(1) NOT NULL,
    method varchar(20),
    md5sig varchar(512) NOT NULL,
    FOREIGN KEY(reference_id) REFERENCES fine(reference_id)
);