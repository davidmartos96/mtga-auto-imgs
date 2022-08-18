# MTGA card images


## Setup

Install the project

```shell script
npm install
```

## Run

First we need to tell the program which cards we want to process. We can do that in the `input_card_names.ts` file.

Then, we need to open MTG Arena and leave it in the "Home" tab.
The configuration tested was the game running in 1920x1080 on windowed mode.

Afterwards, run `npm run start`

This will start the process of finding and creating the card images into the "out/cards" folder.

This process goes as follows:

1. Find the MTGA Arena game region

2. Go into Decks -> Collection

4. Toggle the Craft button, so that we can search for cards we don't have

4. For each card

	a. Search it

	b. Click it

	c. Capture the card region and save it into "out/cards"
