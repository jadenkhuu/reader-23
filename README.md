read-23
-----

*Team: [Jaden Khuu]*
*Status: Draft*
*Last Updated: 22/10/2025*

Description
-----

read-23 is an application which aims to address the challenge of visual tracking in traditional paragraph and text formatting to assist users in reading and comprehension. It is built on the scientific research method called Rapid serial visual presentation (RSVP) which involves presenting a series of visual stimuli, such as words or images, one after another in quick succession at the same location.

Building upon an existing prototype, the app will iterating through each word in a sentence, displaying them sequentially at a centralised position, increasing the users ability to read words quickly.

Some integrated features include an adjustable words per minute pace (WPM), visual tracking of words through sentence highlighting, and sentence tracking/navigating through a paragraph while reading similarly to video scrubbing.

This app aims to assist readers who typically have trouble keeping track of where they are up to when reading traditional paragraphs or want to consume text based content quickly. This approach reduces cognitive load and eye strain, making digital content more accessible for users with reading difficulties, dyslexia, ADHD, or visual processing challenges.

Usage
-----

##### Installation

To begin, install dependencies by navigating to the app folder in the terminal and running:

```
npm install
```

Start the app by running:

```
npm start
```

##### How to use

1. Run read-23
2. Click "select" to select an area of your screen to scan for text
3. Click and drag to make a selection
4.

Software Architecture
-----

This application is built using Electron to make use of its desktop application capabilities. It also utilises system level APIs for screen capturing and OCR processing (for non-plaintext inputs). This tech stack allows for lightweight architecture, prioritising speed and efficient development of future features.

#### Core functionality

1.
