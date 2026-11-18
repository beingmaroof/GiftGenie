# GiftGenie – Personalized Gift Recommendation Web Application

GiftGenie is a web-based application developed to help users find suitable gift ideas based on the recipient's details, occasion, budget and personal preferences. It uses a rule-based recommendation system to match user inputs with gift records stored in a JSON database.

## 1. Project Overview

GiftGenie allows users to explore gift suggestions without manually browsing through a large collection of products. Users can enter details such as the occasion, relationship with the recipient, budget, age group and interests. Based on these inputs, the application filters and ranks suitable gifts.

The application runs primarily in the browser and does not require a traditional backend database or paid external APIs.

## 2. Main Features and Pages

The application consists of four main pages:

### 1. Home Page (`index.html`)
- Introduces the GiftGenie application.
- Provides shortcuts for exploring different occasions and gift categories.
- Displays gift categories and budget-based options.
- Explains the basic steps involved in finding a gift.

### 2. Gift Finder (`finder.html`)
- Collects information about the recipient and gifting occasion.
- Includes fields for budget, age group, gender, interests and other preferences.
- Displays a completion indicator to help users track their form progress.

### 3. Recommendations (`results.html`)
- Displays up to five recommended gifts based on the entered preferences.
- Uses a rule-based scoring system to rank matching items.
- Provides category filters and sorting options.
- Allows users to search through the available gift collection of 100 records.

### 4. Wishlist (`wishlist.html`)
- Allows users to save gifts they are interested in.
- Stores wishlist data using browser LocalStorage.
- Displays the estimated total value of saved gifts.
- Provides an option to remove individual items.

## 3. Technology Stack

The project uses the following technologies:

| HTML5                 | Structure and content of web pages                        |

| CSS3                  | Styling, layouts, animations and responsive design        |

| JavaScript (ES6+)     | Form handling, recommendation logic and user interactions |

| JSON                  | Storage of gift information and related records           |

| Browser LocalStorage  | Saving wishlist items locally                             |

| Node.js               | Running the project through a local development server    |

No frontend framework, backend database, machine learning model or paid external API is used.

## 4. Design and User Interface

GiftGenie's interface follows a minimal design approach inspired by the visual style of Apple's website. The focus is on clear typography, spacious layouts, simple navigation and consistent styling across all pages.

Some of the main design elements include:

- **Typography:** System font stack with support for Apple system fonts and suitable fallback fonts.
- **Colour scheme:** White and light-grey backgrounds with blue accents and dark text.
- **Cards and components:** Rounded corners, subtle borders and soft shadows.
- **Navigation:** A clean navigation layout with a translucent, blurred background effect.
- **Responsiveness:** Layout adjustments for different screen sizes.

The design aims to keep the interface consistent and make the application easy to navigate.

## 5. How the Application Works

1. The user opens the Gift Finder page.
2. They enter details about the recipient, occasion and budget.
3. JavaScript processes the submitted information.
4. The recommendation system compares the entered preferences with records in the gift database.
5. Matching gifts are scored and ranked.
6. The application displays suitable recommendations.
7. Users can save selected gifts to their wishlist for later reference.

## 6. Running the Project Locally

### Prerequisites
- Node.js installed on your system.
- A modern web browser.

### Steps

Clone or download the project and open its folder in a terminal.

Start the local development server:

```bash
npm run dev
```

Open the following address in your browser:

```text
http://localhost:8000
```

### Running the Automated Tests

To execute the project's automated test suite, run:

```bash
npm test
```

The test script checks selected application functionality, including gift data and recommendation-related logic.

## 7. Project Scope and Limitations

GiftGenie is designed as a frontend-based gift recommendation application. Its recommendations are generated using predefined rules and matching scores rather than artificial intelligence or machine learning.

The application does not include user authentication, online payments, a backend database or live product availability and price tracking. Wishlist information is stored locally in the browser and is not automatically synchronized across devices.

## 8. Future Improvements

Some possible improvements include:

- Adding a backend database for centralized data management.
- Introducing user accounts and synchronized wishlists.
- Updating gift information and prices through reliable external services.
- Expanding the gift collection with more categories and preferences.
- Improving recommendation accuracy with additional matching criteria.

## 9. Academic Project

**Project Name:** GiftGenie – Personalized Gift Recommendation Web Application  
**Programme:** Bachelor of Computer Applications (BCA)  
**Semester:** 5th Semester  
**Project Type:** Summer Training Project

---

*GiftGenie was developed as an academic project to apply frontend web development concepts, JavaScript programming and basic recommendation logic in a practical application.*
