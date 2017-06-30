import * as Express from 'express'
import * as Sendmail from 'sendmail'
import * as Crypto from 'crypto'

const timeout = 5 * 60 * 1000; // 5 minutes
const app = Express();

var secret: string = null;
var button_secret: string = null;
var button_response: Express.Response = null;

// endpoint for Button to notify us
app.get('/button', function(
    req: Express.Request,
    resp: Express.Response,
    next: Express.NextFunction
) {
    var mailer = Sendmail();
    secret = Crypto.randomBytes(32).toString('hex');
    mailer({
	'from': 'door-server@app.example.com'
	'to': 'admin-email@example.com'
	'subject': 'door',
	'html': `Requesting Access: <a href="http://${req.hostname}/open/${secret}">Click Here</a>`
    }, function(err: any, reply: any) {
	if (!err) {
	    button_response = resp;
	    setTimeout(function () {
		if (button_response) {
		    button_response.status(200).end('done');
		    button_response = null;
		}
	    }, timeout);
	} else {
	    console.error('error', err);
	    button_response = null;
	    resp.status(500).end('error');
	}
    })
})

// endpoint to request door open
app.get('/open/:token', function(
    req: Express.Request,
    email_resp: Express.Response,
    next: Express.NextFunction
) {
    if (secret == req.params.token && button_response) {
	button_response.status(200).end('open');
	email_resp.type('text').status(200).end('ok');
    } else {
	email_resp.type('text').status(500).end('timed out');
    }
});

app.listen(12345, '127.0.0.1', function() {
    this.setTimeout(timeout);
});
