# GraphQL Profile Project

This project displays user learning data from the Zone01 Kisumu learning platform using their GraphQL API.

## Features

- User authentication with JWT
- Profile dashboard with:
  - Basic user information
  - XP and level progress
  - Audit ratio visualization
  - XP progression chart
  - Skills radar chart
  - Completed projects list
  - Pending projects list

## Setup

1. Clone this repository
2. Open `index.html` in a browser
3. Login with your Zone01 Kisumu credentials

## Technical Details

- Uses the official Zone01 Kisumu GraphQL API endpoint
- Implements JWT authentication
- Creates SVG charts for data visualization
- Responsive design for all screen sizes

## API Endpoints Used

- Authentication: `https://learn.zone01kisumu.ke/api/auth/signin`
- GraphQL: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`