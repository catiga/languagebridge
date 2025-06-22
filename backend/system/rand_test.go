package system

import (
	"testing"
)

func TestGenerateTeacherNo(t *testing.T) {
	// 测试生成多个教师编号
	teacherNos := make(map[string]bool)

	for i := 0; i < 100; i++ {
		teacherNo := GenerateTeacherNo()

		// 检查编号格式
		if len(teacherNo) != 12 {
			t.Errorf("教师编号长度错误，期望12位，实际%d位: %s", len(teacherNo), teacherNo)
		}

		// 检查是否以T开头
		if teacherNo[0] != 'T' {
			t.Errorf("教师编号应该以T开头: %s", teacherNo)
		}

		// 检查年份部分（第2-3位）
		year := teacherNo[1:3]
		if year != "24" && year != "25" { // 允许2024和2025年
			t.Errorf("年份部分错误: %s", year)
		}

		// 检查月份部分（第4-5位）
		month := teacherNo[3:5]
		if month < "01" || month > "12" {
			t.Errorf("月份部分错误: %s", month)
		}

		// 检查随机数部分（第6-11位）
		randomPart := teacherNo[5:11]
		for _, c := range randomPart {
			if c < '0' || c > '9' {
				t.Errorf("随机数部分应该都是数字: %s", randomPart)
			}
		}

		// 检查校验位
		base := teacherNo[:11]
		sum := 0
		for _, c := range base {
			if c >= '0' && c <= '9' {
				sum += int(c - '0')
			}
		}
		expectedCheckDigit := sum % 10
		actualCheckDigit := int(teacherNo[11] - '0')
		if expectedCheckDigit != actualCheckDigit {
			t.Errorf("校验位错误，期望%d，实际%d: %s", expectedCheckDigit, actualCheckDigit, teacherNo)
		}

		// 检查唯一性
		if teacherNos[teacherNo] {
			t.Errorf("教师编号重复: %s", teacherNo)
		}
		teacherNos[teacherNo] = true
	}

	t.Logf("成功生成%d个唯一的教师编号", len(teacherNos))
}

func TestGenerateTeacherNoUniqueness(t *testing.T) {
	// 测试大量生成时的唯一性
	teacherNos := make(map[string]bool)
	count := 1000

	for i := 0; i < count; i++ {
		teacherNo := GenerateTeacherNo()
		if teacherNos[teacherNo] {
			t.Errorf("发现重复的教师编号: %s", teacherNo)
		}
		teacherNos[teacherNo] = true
	}

	if len(teacherNos) != count {
		t.Errorf("期望生成%d个唯一编号，实际生成%d个", count, len(teacherNos))
	}

	t.Logf("成功生成%d个唯一的教师编号", len(teacherNos))
}
