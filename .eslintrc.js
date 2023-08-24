module.exports = {
  "env": {
    "es2021": true
  },
  "extends": [
    "standard-with-typescript",
    "plugin:prettier/recommended",
    "prettier",
  ],
  "plugins": [
    "prettier"
  ],
  "overrides": [
    {
      "env": {
        "node": true
      },
      "files": [
        'src/**/*.ts',
        'src/**/*.js',
      ],
      "parserOptions": {
        "sourceType": "script",
        "project": "./tsconfig.json"
      }
    }
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": [2, {
      "allowNullableString": true
    }]
  }
}
