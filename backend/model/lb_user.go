package model

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mr-tron/base58"
)

type UserInfo struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LoginId    string    `gorm:"column:login_id;type:varchar(255);not null" json:"login_id"`
	Email      string    `gorm:"column:email" json:"email"`
	Name       string    `gorm:"column:name" json:"name"`
	Password   string    `gorm:"column:password" json:"-"`
	CountryID  uint64    `gorm:"column:country_id" json:"country_id"`
	Language   string    `gorm:"column:language" json:"language"`
	AddTime    time.Time `gorm:"column:add_time" json:"add_time"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
	Status     string    `gorm:"column:status" json:"status"`
	UserNo     string    `gorm:"column:user_no" json:"user_no"`
}

func (UserInfo) TableName() string {
	return "user_info"
}

func (u UserInfo) IsChecked() bool {
	if u.Status == "00" {
		return false
	}
	return true
}

type UserProfile struct {
	ID                uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID            uint64    `gorm:"column:user_id" json:"user_id"`
	NickName          string    `gorm:"column:nick_name" json:"nick_name"`
	Avatar            string    `gorm:"column:avatar" json:"avatar"`
	LivingCountryID   uint64    `gorm:"column:living_country_id" json:"living_country_id"`
	LivingCountryName string    `gorm:"column:living_country_name" json:"living_country_name"`
	LivingCountryCode string    `gorm:"column:living_country_code" json:"living_country_code"`
	ContactPhone      string    `gorm:"column:contact_phone" json:"contact_phone"`
	NativeLanguage    string    `gorm:"column:native_language" json:"native_language"`
	UpdateTime        time.Time `gorm:"column:update_time" json:"update_time"`
}

func (UserProfile) TableName() string {
	return "user_profile"
}

type UserMember struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint64    `gorm:"column:user_id" json:"user_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Email       string    `gorm:"column:email" json:"email"`
	RelType     string    `gorm:"column:rel_type" json:"rel_type"`
	RelDesc     string    `gorm:"column:rel_desc" json:"rel_desc"`
	UpdateTime  time.Time `gorm:"column:update_time" json:"update_time"`
	AddTime     time.Time `gorm:"column:add_time" json:"add_time"`
	Flag        int       `gorm:"column:flag" json:"flag"`
	Gender      int       `gorm:"column:gender" json:"gender"`
	Birthday    string    `gorm:"column:birthday" json:"birthday"`
	Personality string    `gorm:"column:personality" json:"personality"`
	Character   string    `gorm:"column:character" json:"character"`
}

func (UserMember) TableName() string {
	return "user_member"
}

type UserSetting struct {
	ID        uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64 `gorm:"column:user_id" json:"user_id"`
	SpecName  string `gorm:"column:spec_name" json:"spec_name"`
	SpecValue string `gorm:"column:spec_value" json:"spec_value"`
}

func (UserSetting) TableName() string {
	return "user_setting"
}

type UserWallet struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint64    `gorm:"column:user_id" json:"user_id"`
	Wallet     string    `gorm:"column:wallet;type:varchar(255);not null" json:"wallet"`
	Chain      string    `gorm:"column:chain" json:"chain"`
	CreateTime time.Time `gorm:"column:create_time" json:"create_time"`
	RefID      uint64    `gorm:"column:ref_id" json:"ref_id"`
}

func (UserWallet) TableName() string {
	return "user_wallet"
}

type AuthMessage struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	AuthKey    string    `gorm:"column:auth_key;type:varchar(255);not null" json:"auth_key"`
	AuthMsg    string    `gorm:"column:auth_msg" json:"auth_msg"`
	Chain      string    `gorm:"column:chain" json:"chain"`
	Nonce      string    `gorm:"column:nonce;type:varchar(255);not null" json:"nonce"`
	CreateTime time.Time `gorm:"column:create_time" json:"create_time"`
	ExpireTime time.Time `gorm:"column:expire_time" json:"expire_time"`
}

func (AuthMessage) TableName() string {
	return "user_auth_msg"
}

func (auth AuthMessage) ComputeAuthDigest(base64Sig string) bool {
	data := auth.Format()

	switch strings.ToLower(auth.Chain) {
	case "solana":
		publicKey, err := base58.Decode(auth.AuthKey)
		if err != nil {
			log.Println("solana pubkey decode error:", err)
			return false
		}
		signature, err := base64.StdEncoding.DecodeString(base64Sig)
		if err != nil {
			log.Println("solana sig decode error:", err)
			return false
		}
		return ed25519.Verify(publicKey, []byte(data), signature)
	default: // EVM链
		// base64Sig 实际上应该是 hex 编码的签名
		sig, err := hex.DecodeString(base64Sig[2:])
		if err != nil {
			log.Println("evm sig decode error:", err)
			return false
		}
		// EVM签名消息前要加前缀
		msg := []byte(data)
		prefix := "\x19Ethereum Signed Message:\n" + strconv.Itoa(len(msg))
		prefixedMsg := []byte(prefix)
		prefixedMsg = append(prefixedMsg, msg...)

		hash := crypto.Keccak256(prefixedMsg)
		// 签名长度为65字节，最后一字节为V
		if len(sig) != 65 {
			log.Println("evm sig length error")
			return false
		}
		// go-ethereum v1.11+ 需要把V修正到27/28
		if sig[64] >= 27 {
			sig[64] -= 27
		}
		pubKey, err := crypto.SigToPub(hash, sig)
		if err != nil {
			log.Println("evm sig to pub error:", err)
			return false
		}
		recoveredAddr := crypto.PubkeyToAddress(*pubKey).Hex()
		// auth.AuthKey 存储的是钱包地址（小写/大写都可，建议统一小写）
		return strings.EqualFold(recoveredAddr, auth.AuthKey)
	}
}

func (auth AuthMessage) Format() string {
	data := fmt.Sprintf("Wallet:%s\nChain:%s\nMessage:%s\nNonce:%s\n",
		auth.AuthKey,
		auth.Chain,
		auth.AuthMsg,
		auth.Nonce,
	)
	return data
}
