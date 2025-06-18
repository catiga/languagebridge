package model

type DictCountry struct {
	ID           uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string `gorm:"column:name" json:"name"`
	Iso2         string `gorm:"column:iso2" json:"iso2"`
	Iso3         string `gorm:"column:iso3" json:"iso3"`
	PhoneCode    string `gorm:"column:phone_code" json:"phone_code"`
	Continent    string `gorm:"column:continent" json:"continent"`
	Timezone     string `gorm:"column:timezone" json:"timezone"`
	Currency     string `gorm:"column:currency" json:"currency"`
	LanguageCode string `gorm:"column:language_code" json:"language_code"`
}

func (DictCountry) TableName() string {
	return "dict_country_code"
}
