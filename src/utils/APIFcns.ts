import * as mailer from 'nodemailer';

import enVars from '../config/vars';

const {mail} = enVars;
export const sendmail = (recipient = mail.to, url : string, subject = mail.subject) => {
  // setup email data with unicode symbols
  const mailOptions = {
    from: mail.from,
    to: recipient,
    subject,
    // text: `${mail.text} \n`,
    html: `
    <html><body>
      <p>Please confirm your email address</p>
      <a href=${url}>Click to confirm email</a>
      </body></html>
      `
    // attachments: [{ filename: fname, content: fs.createReadStream(file) }],
  };
  const transporter = mailer.createTransport({
    host: mail.host, port: mail.port, secure: mail.secure, // true for 465, false for other ports
    auth: {
      user: mail.user,
      pass: mail.pass
    }
  });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', mailer.getTestMessageUrl(info));

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com> Preview URL:
    // https://ethereal.email/message/WaQKMgKddxQDoou...
  });
}