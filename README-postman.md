npm install

1. Konfiguration

Kopiera .env.example → .env och fyll i värdena:

JWT_SECRET=please_change_me_to_a_random_secret
JWT_EXPIRES_IN=10h
REGION=eu-north-1
TABLE_NAME=Quiztopia

I produktion hämtas JWT_SECRET från SSM Parameter Store: /quiztopia/<stage>/JWT_SECRET.

2. Deploy

sls deploy --stage prod --region eu-north-1


* Authentisering 

Signup & Login är öppna (ingen token krävs).

Vid login får du accessToken (JWT).

För skyddade endpoints:

Authorization: Bearer <accessToken>


* DynamoDB-modell

| Typ      | PK              | SK                             |
| -------- | --------------- | ------------------------------ |
| User     | `USER#{userId}` | `PROFILE`                      |
| Quiz     | `QUIZ#{quizId}` | `METADATA`                     |
| Question | `QUIZ#{quizId}` | `QUESTION#{questionId}`        |
| Score    | `QUIZ#{quizId}` | `SCORE#{submittedAt}#{userId}` |



* GSI
GSIEmail — GSI1PK=EMAIL#{email}, GSI1SK=PROFILE (login)

GSIUserQuizzes — GSI2PK=USER#{userId}, GSI2SK=QUIZ#{quizId} (“mina quiz”)

GSILeaderboard — GSI3PK=QUIZ#{quizId}, GSI3SK={totalPoints} (topplista)

GSIAllQuizzes — GSI4PK=QUIZ, GSI4SK={createdAt} (alla quiz)

3. ENDPOINTS 

Bas-URL:

https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com

Alla bodies är JSON. Svar är JSON.

Postman: En collection finns i repo:t.

AUTH (öppna)
1) Skapa användare (Signup)

POST /auth/signup
Headers

Content-Type: application/json

Body (JSON, required)

{
  "email": "demo@example.com",
  "password": "Passw0rd!",
  "username": "demo_user"
}

2) Logga in (Login)

POST /auth/login
Headers

Content-Type: application/json

Body (JSON, required)

{
  "email": "demo@example.com",
  "password": "Passw0rd!"
}


Svar (200)

{
  "accessToken": "<jwt>",
  "user": {
    "userId": "uuid",
    "email": "demo@example.com",
    "name": null
  }
}