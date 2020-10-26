# insomnia-plugin-aws-cognito-token
Insomnia plugin for AWS Cognito allowing you to fetch the JWT Token automatically and inject the token in the `Authorization` header.

Note: version 0.10.0 changed the Tags order, you may have to reorder your Tags value.

Note: version 0.14.0 change the UserPoolId to Region, it is kept backward compabible but you should remove the string after the underscore to keep only the region part of the pool. E.g. `us-east-1_ABCDEF` should be `us-east-1`

## NPM
[https://www.npmjs.com/package/insomnia-plugin-aws-cognito-token](https://www.npmjs.com/package/insomnia-plugin-aws-cognito-token)

## Insomnia
[Insomnia](https://support.insomnia.rest/) is a free cross-platform desktop application that takes the pain out of interacting with HTTP-based APIs. 

## Plugin
[Insomian Plugin API](https://support.insomnia.rest/article/26-plugins) support an Asynchronous API perfect form performing AWS Cognito Authentication before doing any request to AppSync for example

## Install
![Install](https://github.com/syl20lego/insomnia-plugin-aws-cognito-token/raw/master/images/Install.png)

## Usage

### Environment

![Environment](https://github.com/syl20lego/insomnia-plugin-aws-cognito-token/raw/master/images/Add_environment.png)

### Add Plugin's data

![Form](https://github.com/syl20lego/insomnia-plugin-aws-cognito-token/raw/master/images/Plugin_form.png)

### Request Header

![Header](https://github.com/syl20lego/insomnia-plugin-aws-cognito-token/raw/master/images/Authorization_header.png)

