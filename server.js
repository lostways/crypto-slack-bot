Config = require('./config');
OTP = require('crypto-classic-otp');
Slack = require('slack-client');

var token = Config.token;

var slack = new Slack(token, true, true);


var makeMention = function(userId) {
    return '<@' + userId + '>';
};

var isDirect = function(userId, messageText) {
    var userTag = makeMention(userId);
    return messageText &&
           messageText.length >= userTag.length &&
           messageText.substr(0, userTag.length) === userTag;
};

slack.on('open', function () {
  var channels = Object.keys(slack.channels)
    .map(function (k) { return slack.channels[k]; })
    .filter(function (c) { return c.is_member; })
    .map(function (c) { return c.name; });

  var groups = Object.keys(slack.groups)
    .map(function (k) { return slack.groups[k]; })
    .filter(function (g) { return g.is_open && !g.is_archived; })
    .map(function (g) { return g.name; });
    
  console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

  if (channels.length > 0) {
      console.log('You are in: ' + channels.join(', '));
  }
  else {
      console.log('You are not in any channels.');
  }

  if (groups.length > 0) {
     console.log('As well as: ' + groups.join(', '));
  }
});

//Messages
slack.on('message', function (m) {
  //console.log(m);
  var channel = slack.getChannelGroupOrDMByID(m.channel);
  var user = slack.getUserByID(m.user);
  var directMessage = isDirect(slack.self.id, m.text);
  if (m.type === 'message' && (  directMessage || channel.name === user.name ) ) {
    
    console.log(channel.name + ':' + user.name + ':' + m.text);

    var messageText = '';
    if(isDirect) {
       messageText = m.text.substr(makeMention(slack.self.id).length + 1).trim();
    } else {
      messageText = m.text;
    }

    var mArray = messageText.split('|');
    //console.log(messageText);
    //console.log(mArray);
    switch(mArray[0]) {
      case 'otp':
        channel.send(user.name + '\r\n' + OTP.decipher(mArray[1],mArray[2]));
      break;
      case 'help':
        channel.send(user.name + '\r\n' + "available commands:"
          + "\n\r" + "otp|CIPHERTEXT|KEY");
      break;
    }
  }
});

slack.login();