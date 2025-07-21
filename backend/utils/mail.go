package utils

import (
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"gopkg.in/gomail.v2"
)

// 生成6位随机数字验证码
func Generate6DigitCode() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SendVerifyCodeMail(toEmail, sort string) error {
	from := os.Getenv("GMAIL_APP_ACC")
	password := os.Getenv("GMAIL_APP_PWD")

	if len(from) == 0 || len(password) == 0 {
		return fmt.Errorf("unable to send email for missing configuration")
	}

	code := Generate6DigitCode()

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "[LangBridge] Your Email Verification Code")
	m.SetBody("text/html", fmt.Sprintf(`
        <div style="font-family:Arial,sans-serif;font-size:16px;color:#222;max-width:420px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:32px 24px;background:#f9fafb;">
            <div style="text-align:center;margin-bottom:18px;">
                <span style="display:inline-block;font-size:22px;font-weight:bold;color:#2563eb;letter-spacing:1px;">LangBridge</span>
            </div>
            <p style="margin-bottom:18px;">Dear user,</p>
            <p style="margin-bottom:18px;">You are receiving this email because you (or someone else) requested an email verification code for your LangBridge account.</p>
            <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:4px;color:#2563eb;background:#fff;padding:12px 32px;border-radius:8px;border:1px solid #dbeafe;">%s</span>
            </div>
            <p style="margin-bottom:18px;">This code is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>
            <p style="margin-bottom:18px;">If you did not request this code, you can safely ignore this email.</p>
            <div style="margin-top:32px;text-align:center;color:#888;font-size:13px;">This is an official email from LangBridge. <br/>If you have any questions, please contact us at <a href=\"mailto:support@langbridge.com\" style=\"color:#2563eb;\">support@langbridge.com</a>.</div>
        </div>
    `, code))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, password)

	if err := d.DialAndSend(m); err != nil {
		return err
	}

	vp := model.VerificationProcess{
		Target:         toEmail,
		Type:           "10",
		Code:           code,
		AddTime:        time.Now(),
		ValidatePeriod: 600,
		Sort:           sort,
		Status:         "000",
	}
	db := system.GetDb()
	db.Save(&vp)
	return nil
}

// 用户提交请假后，通知老师处理
func SendLeaveRequestToTeacherMail(teacherEmail, studentName, courseName, lessonDate, startTime, endTime string) error {
	from := os.Getenv("GMAIL_APP_ACC")
	password := os.Getenv("GMAIL_APP_PWD")

	if len(from) == 0 || len(password) == 0 {
		return fmt.Errorf("unable to send email for missing configuration")
	}

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", teacherEmail)
	m.SetHeader("Subject", "[LangBridge] New Leave Request Submitted")
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family:Arial,sans-serif;font-size:16px;color:#222;max-width:420px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:32px 24px;background:#f9fafb;">
			<div style="text-align:center;margin-bottom:18px;">
				<span style="display:inline-block;font-size:22px;font-weight:bold;color:#2563eb;letter-spacing:1px;">LangBridge</span>
			</div>
			<p style="margin-bottom:18px;">Dear Teacher,</p>
			<p style="margin-bottom:18px;">A student has submitted a leave request that requires your attention:</p>
			<div style="margin-bottom:18px;">
				<b>Student:</b> %s<br/>
				<b>Course:</b> %s<br/>
				<b>Original Schedule:</b> %s %s - %s
			</div>
			<p style="margin-bottom:18px;">Please log in to your LangBridge dashboard to review and process this request.</p>
			<div style="margin-top:32px;text-align:center;color:#888;font-size:13px;">This is an official email from LangBridge. <br/>If you have any questions, please contact us at <a href=\"mailto:support@langbridge.com\" style=\"color:#2563eb;\">support@langbridge.com</a>.</div>
		</div>
	`, studentName, courseName, lessonDate, startTime, endTime))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, password)

	if err := d.DialAndSend(m); err != nil {
		return err
	}
	return nil
}

// 老师处理后，通知用户结果
func SendLeaveResultToUserMail(userEmail, teacherName, courseName, lessonDate, startTime, endTime, result, note string) error {
	from := os.Getenv("GMAIL_APP_ACC")
	password := os.Getenv("GMAIL_APP_PWD")

	if len(from) == 0 || len(password) == 0 {
		return fmt.Errorf("unable to send email for missing configuration")
	}

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", userEmail)
	m.SetHeader("Subject", "[LangBridge] Your Leave Request Has Been Processed")
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family:Arial,sans-serif;font-size:16px;color:#222;max-width:420px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:32px 24px;background:#f9fafb;">
			<div style="text-align:center;margin-bottom:18px;">
				<span style="display:inline-block;font-size:22px;font-weight:bold;color:#2563eb;letter-spacing:1px;">LangBridge</span>
			</div>
			<p style="margin-bottom:18px;">Dear Student,</p>
			<p style="margin-bottom:18px;">Your leave request for the following class has been <b style='color:%s;'>%s</b> by your teacher:</p>
			<div style="margin-bottom:18px;">
				<b>Teacher:</b> %s<br/>
				<b>Course:</b> %s<br/>
				<b>Original Schedule:</b> %s %s - %s
			</div>
			%s
			<p style="margin-bottom:18px;">If you have any questions, please contact your teacher or LangBridge support.</p>
			<div style="margin-top:32px;text-align:center;color:#888;font-size:13px;">This is an official email from LangBridge. <br/>If you have any questions, please contact us at <a href=\"mailto:support@langbridge.com\" style=\"color:#2563eb;\">support@langbridge.com</a>.</div>
		</div>
	`,
		// 状态颜色
		map[string]string{"Approved": "#16a34a", "Rejected": "#dc2626"}[result],
		result,
		teacherName, courseName, lessonDate, startTime, endTime,
		func() string {
			if note != "" {
				return fmt.Sprintf("<div style='margin-bottom:18px;'><b>Teacher's Note:</b> %s</div>", note)
			}
			return ""
		}(),
	))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, password)

	if err := d.DialAndSend(m); err != nil {
		return err
	}
	return nil
}
