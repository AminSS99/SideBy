import type { ruRU } from "@clerk/localizations";

/**
 * Clerk ships no Azerbaijani pack. Everything not listed here falls back to
 * Clerk's built-in English, so this only covers the screens new users hit
 * first: sign-in, sign-up, email/password steps and the divider/social row.
 */
export const clerkAz: Partial<typeof ruRU> = {
  locale: "az-AZ",
  formButtonPrimary: "Davam et",
  formFieldLabel__emailAddress: "E-poçt ünvanı",
  formFieldLabel__password: "Parol",
  formFieldLabel__username: "İstifadəçi adı",
  formFieldLabel__emailAddress_username: "E-poçt və ya istifadəçi adı",
  formFieldLabel__firstName: "Ad",
  formFieldLabel__lastName: "Soyad",
  formFieldLabel__confirmPassword: "Parolu təsdiqləyin",
  formFieldInputPlaceholder__emailAddress: "E-poçt ünvanınızı daxil edin",
  formFieldInputPlaceholder__password: "Parolunuzu daxil edin",
  formFieldInputPlaceholder__emailAddress_username: "E-poçt və ya istifadəçi adı daxil edin",
  formFieldInputPlaceholder__firstName: "Adınız",
  formFieldInputPlaceholder__lastName: "Soyadınız",
  formFieldAction__forgotPassword: "Parolu unutmusunuz?",
  dividerText: "və ya",
  footerActionLink__useAnotherMethod: "Başqa üsuldan istifadə edin",
  lastAuthenticationStrategy: "Son istifadə",
  socialButtonsBlockButton: "{{provider|titleize}} ilə davam edin",
  signIn: {
    start: {
      title: "{{applicationName}} hesabına daxil olun",
      subtitle: "Xoş gəlmisiniz! Davam etmək üçün daxil olun",
      actionText: "Hesabınız yoxdur?",
      actionLink: "Qeydiyyatdan keçin",
    },
    password: {
      title: "Parolunuzu daxil edin",
      subtitle: "Hesabınıza bağlı parolu daxil edin",
      actionLink: "Başqa üsuldan istifadə edin",
    },
    emailCode: {
      title: "E-poçtunuzu yoxlayın",
      subtitle: "{{applicationName}} hesabına davam etmək üçün",
      formTitle: "Təsdiq kodu",
      resendButton: "Kod gəlmədi? Yenidən göndər",
    },
  },
  signUp: {
    start: {
      title: "Hesab yaradın",
      subtitle: "Xoş gəlmisiniz! Başlamaq üçün məlumatları doldurun.",
      actionText: "Artıq hesabınız var?",
      actionLink: "Daxil olun",
    },
    emailCode: {
      title: "E-poçtunuzu təsdiqləyin",
      subtitle: "{{applicationName}} hesabına davam etmək üçün",
      formTitle: "Təsdiq kodu",
      resendButton: "Kod gəlmədi? Yenidən göndər",
    },
  },
};
