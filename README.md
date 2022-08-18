# MTGA card images


## Setup

Install the project

```shell script
npm install
```

## Run

First we need to configure the program parameters in the `config/config.ts` file. Most important here is the game resolution and the desktop scale (which usually is 1.0).
We also need to tell the program which cards we want to process. We can do that in the `config/input_card_names.ts` file.

Then, we need to open MTG Arena and leave it in the "Home" tab. We need to make sure the game is running on windowed mode and in the same resolution as in the config file.

Afterwards, run `npm run start`

This will start the process of finding and creating the card images into the "out/cards" folder.

This process goes as follows:

1. Find the MTGA Arena game region

2. Go into Decks -> Collection

4. Toggle the Craft button, so that we can search for cards we don't have

4. For each card

	a. Search it

	b. Click it

	c. Capture the card region and save it into `out/cards`. This step includes some image processing using OpenCV to crop the card borders and round them.
