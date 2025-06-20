package utils

import "time"

var TimeLayout = "2006-01-02 15:04:05"

func PeriodTime(period string) string {
	switch period {
	case "1m":
		return time.Now().Add(-time.Minute).Format(TimeLayout)
	case "5m":
		return time.Now().Add(-5 * time.Minute).Format(TimeLayout)
	case "15m":
		return time.Now().Add(-15 * time.Minute).Format(TimeLayout)
	case "30m":
		return time.Now().Add(-30 * time.Minute).Format(TimeLayout)
	case "1h":
		return time.Now().Add(-time.Hour).Format(TimeLayout)
	case "2h":
		return time.Now().Add(-2 * time.Hour).Format(TimeLayout)
	case "4h":
		return time.Now().Add(-4 * time.Hour).Format(TimeLayout)
	case "6h":
		return time.Now().Add(-6 * time.Hour).Format(TimeLayout)
	case "12h":
		return time.Now().Add(-12 * time.Hour).Format(TimeLayout)
	case "24h":
		return time.Now().Add(-24 * time.Hour).Format(TimeLayout)
	case "1d":
		return time.Now().Add(-24 * time.Hour).Format(TimeLayout)
	case "3d":
		return time.Now().Add(-3 * 24 * time.Hour).Format(TimeLayout)
	case "4d":
		return time.Now().Add(-4 * 24 * time.Hour).Format(TimeLayout)
	case "1w":
		return time.Now().Add(-7 * 24 * time.Hour).Format(TimeLayout)
	case "1M":
		return time.Now().Add(-30 * 24 * time.Hour).Format(TimeLayout)
	default:
		return time.Now().Add(-30 * 24 * time.Hour).Format(TimeLayout)
	}
}
func PeriodTimeCacheExpired(period string) time.Duration {
	switch period {
	case "1m":
		return time.Second * 40
	case "5m":
		return time.Minute * 2
	case "15m":
		return time.Minute * 3
	case "30m":
		return time.Minute * 5
	case "1h":
		return time.Minute * 5
	case "2h":
		return time.Minute * 5
	case "4h":
		return time.Minute * 10
	case "6h":
		return time.Minute * 10
	case "12h":
		return time.Minute * 10
	case "24h":
		return time.Minute * 10
	case "1d":
		return time.Minute * 30
	case "3d":
		return time.Minute * 30
	case "4d":
		return time.Minute * 30
	case "1w":
		return time.Minute * 30
	case "1M":
		return time.Minute * 30
	default:
		return time.Minute
	}
}
func ParseTimeZone(timeStr string, plus int, timeLayout string) (timeStr1 string) {
	parse, err := time.Parse(timeLayout, timeStr)
	if err != nil {
		return timeStr
	}
	parse = parse.Add(time.Hour * time.Duration(plus))
	timeStr1 = parse.Format(timeLayout)
	return timeStr1
}

func GetWeekdayNumber(dateStr string) (int, error) {
	layout := "2006-01-02"
	t, err := time.Parse(layout, dateStr)
	if err != nil {
		return 0, err
	}
	weekday := int(t.Weekday()) // time.Weekday: Sunday = 0, Monday = 1, ..., Saturday = 6
	if weekday == 0 {
		return 7, nil // Sunday
	}
	return weekday, nil
}

func GetNextDate(dateStr string) (string, error) {
	layout := "2006-01-02"
	t, err := time.Parse(layout, dateStr)
	if err != nil {
		return "", err
	}
	nextDay := t.AddDate(0, 0, 1)
	return nextDay.Format(layout), nil
}

func CompareDate(date1, date2 string) (int, error) {
	layout := "2006-01-02"
	t1, err1 := time.Parse(layout, date1)
	if err1 != nil {
		return 0, err1
	}
	t2, err2 := time.Parse(layout, date2)
	if err2 != nil {
		return 0, err2
	}

	if t1.After(t2) {
		return 1, nil
	} else if t1.Before(t2) {
		return -1, nil
	} else {
		return 0, nil
	}
}
