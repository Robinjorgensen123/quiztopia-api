köra lokalt och deploy

npm install

kolla env.Example

Authetisering:

Signup & login är öppna (ingen token krävs)
Vid login får du accessToken (JWT)
för skyddade endpoints skicka ( Authorization: Bearer <accessToken> ) 

DynamoDb modell: 

| Typ      | PK              | SK                             |
| -------- | --------------- | ------------------------------ |
| User     | `USER#{userId}` | `PROFILE`                      |
| Quiz     | `QUIZ#{quizId}` | `METADATA`                     |
| Question | `QUIZ#{quizId}` | `QUESTION#{questionId}`        |
| Score    | `QUIZ#{quizId}` | `SCORE#{submittedAt}#{userId}` |


GSI: 

* GSIEmail — GSI1PK=EMAIL#{email}, GSI1SK=PROFILE (login)
* GSIUserQuizzes — GSI2PK=USER#{userId}, GSI2SK=QUIZ#{quizId} (“mina quiz”)
* GSILeaderboard — GSI3PK=QUIZ#{quizId}, GSI3SK={totalPoints} (topplista)
* GSIAllQuizzes — GSI4PK=QUIZ, GSI4SK={createdAt} (alla quiz)

ENDPOINTS:

Bas-URL: https://<api-id>.execute-api.eu-north-1.amazonaws.com
Alla bodies är JSON. Svar är JSON.

POSTMAN endpoints

har också bifogat en 

  GET - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes

  GET - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes/{quizId}

  POST - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes

  DELETE - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes/{quizId}

  POST - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes/{quizId}/questions

  POST - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes/{quizId}/scores

  GET - https://rhrt4gcff2.execute-api.eu-north-1.amazonaws.com/quizzes/{quizId}/leaderboard

