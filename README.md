reader-23
-----

*Team: [Jaden Khuu]*

*Status: Version 1.1*

*Last Updated: 18/12/2025*

Description
-----

reader-23 is an application which aims to address the challenge of visual tracking in traditional paragraph and text formatting to assist users in reading and comprehension. It is built on the scientific research method called Rapid serial visual presentation (RSVP) which involves presenting a series of visual stimuli, such as words or images, one after another in quick succession at the same location. This approach to present visual stimuli should improve the users ability to focus and heighten their ability to consume text-based content.

For a better understanding of what RSVP is and a 20 second demo to try it out, check out this YouTube video by Quirkology https://youtu.be/K8dIVNDMA_0

The application is intended to be used as a floating helper, sitting beside the users main display of text. reader-23 will iterate through words in paragraph, displaying them sequentially at a centralised position, increasing the users ability to read words quickly. This app is not meant to replace reading entirely, the intention of this application is to be used along side traditional reading as a tool to assist readers who may get lost following traditional line reading. As such, a line highlight will also follow the selected text, keeping track of where the user is up to for reading, allowing them to refer back to the original medium should they need to. 

<div align="center">
  <video src="https://github.com/user-attachments/assets/8582d018-3bbd-4b21-bfbb-eb9c6c71fc3f" width="600" controls autoplay loop muted playsinline></video>
</div>

This app aims to assist users who typically have trouble keeping track of their reading progress with traditional formatted paragraphs. This app can also help readers who want to consume text-based content more quickly and efficiently. This approach reduces cognitive load and eye strain, making digital content more accessible for users who may have reading difficulties, dyslexia, ADHD, or visual processing challenges. 

Installation
-----

1. Navigate to the release page on the right side of the GitHub repo.
2. Download the setup.exe of the latest version.
3. Run the setup.exe to install the app as a program on your machine.
4. reader-23 will launch after set up
5. reader-23 will also become a program on your machine which you can uninstall from 'Add and remove programs' (Windows)
6. The app can be found by searching an app in the search bar (Windows)

How to use
-----

When you first run the application the interface is comprised of 3 main sections. The title bar, the main display, and the control buttons.

First, familiarise yourself with the control buttons section locate at the lower half of the application. 

<div align="center">
  <img width="263" height="393" alt="Whole App" src="https://github.com/user-attachments/assets/81dc247e-cdff-457b-a61f-0800a06f21b3" />  
  <img width="196" height="172" alt="main buttons Image" src="https://github.com/user-attachments/assets/63093187-7683-43b0-9771-7da0e0dd0cc2" />
</div>

- **Top button** is **'select screen'** to select a section of the screen to scan for text, leaving a persistent green border to show the selection
  - While selecting, you can press ESC or right-click to cancel the selection
  - If a selection already exists, pressing the **'select screen'** button again will remove the selection and reset the app.
- **Left and right buttons** are **'previous' and 'next'**. This has a keyboard shortcut of ArrowLeft and ArrowRight respectively.
- **Centre button** is **'play/pause'**. This has a keyboard shortcut of "spacebar"
- **Bottom button** is **'refresh'** to refresh the scan of an existing screen selection.
  - The main use of this is to streamline the user experience
  - Eg. suppose the user is reading a page of a PDF and they have made a selection on screen. They scroll down to the next page to continue reading. Instead of reselecting the exact same area, the user can recycle the existing selection and click refresh to scan for new text.

Troubleshooting
-----

In order for the line highlighting to be accurate, ensure your 'Scale' in display settings is the default 100%
- If the text highlighting does not align with the text or follow the lines properly, that is likely why

### Typical user flow
1. Click the 'select screen' button to select an area of the current screen to scan for text.
2. Once the screen is scanned, WPM (words per minute) is adjustable to the users reading pace.
3. Upon successful scanning, the display area will show the first word and the next word in the sequence
4. Pressing play will begin the sequence of showing words at a centralised location in large and dark font. The play button becomes a pause button to pause during the iteration at any time
5. Keep your eyes focused on the middle of the display area to read the text and utilise RSVP.
6. Once the paragraph is finished, the text will stop iterating and the pause button will become play again.
7. From here, either:
   - Advance to the next paragraph by pressing **'ArrowRight'** or clicking the **'next button'**
   - Press **'Spacebar'** or click **'play button'** to replay the paragraph and read again
   - Or, if you have finished reading the page, navigate to new content and reuse the existing selection with **'refresh button'**

Functions and Features in depth
-----
<div align="center">
  <img width="335" height="382" alt="Whole App example" src="https://github.com/user-attachments/assets/c833af1a-a3ad-4e6f-bb28-b4788db12f1f" />
</div>

### Title Bar

The title bar is generally comprised of the same elements found in typical desktop applications. A title, and buttons for minimising, maximising, and closing the app. A unique button is the **'thumbpin button'** which allows the app to be pinned to always stay on top of other windows. When it is enaabled, it is indicated by the being green, and it will turn grey when disabled.

<div align="center">
  <img width="88" height="72" alt="ipod pixel main-Sheet" src="https://github.com/user-attachments/assets/af87a402-8d54-4d78-90b9-d127e2bc81ca" />
</div>

### Main Display

The main display will display text sequentially at a rate based on the set WPM (Words per minute) which is adjustable by the slider right below it. 

The text iteration simulates generally speaking and reading patterns, providing natural pauses and delays for punctuation such as sentence enders, commas, quotation marks, parenthesis brackets.

This allows the reading to both be quick and efficient without sacrificing the dynamic nature of typical reading, where punctuation can dictate how a sentence is read.

### Control Buttons

The control buttons are in the shape of a circle similar to that of an Apple iPod. It can be divided into 5 sections. 

The **top button** is the 'select screen' button which is the first step of using the app. The user can click the button to bring up a dark grey overlay of their current screen, prompting them to click and drag to select an area to scan for text. 

The **center button **is the 'play/pause' button responsible for pausing and playing the sequence.

The **left and right buttons** will navigate back and forth between paragraphs respectively. Alike other software, while in the middle of a paragraph, pressing the back button will bring you to the start of the current paragraph, and only go to the previous paragraph upon pressing again.

The **bottom button** is the 'refresh button' which only operates if the user has an existing selection on the screen. The refresh button will rescan the selected area for text. This is useful if the user selects a part of the screen like a standard page size, finishes reading the page, and scrolls to the next page. They can press refresh to rescan for new text without having to remake the same selection


Software Architecture
-----

This application is built using Electron to make use of its desktop application capabilities. It also utilises system level APIs for screen capturing and OCR processing (for non-plaintext inputs). This tech stack allows for lightweight architecture, prioritising speed and efficient development of future features.

The pixelated graphic aesthetic was designed by me and drawn using Aseprite art software
