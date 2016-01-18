The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Future releases:

- **0.17 branch cut**, 0.17.0-rc - beginning of **week of Dec 7**
- 0.17.0 - Dec 17
- (Holiday break)
- **0.18 branch cut**, 0.18.0-rc - **week of Jan 4**
- 0.18.0 - Jan 18
- **0.19 branch cut**, 0.19.0-rc - **week of Jan 18**
- 0.19.0 - Feb 1
- **0.20 branch cut**, 0.19.0-rc - **week of Feb 1**
- 0.20.0 - Feb 15
- ...

## One time setup

Set up Sinopia: https://github.com/facebook/react-native/tree/master/react-native-cli

## Cut a release branch

To cut a release branch and check that everything works, you'll need Mac OS with the [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

    cd react-native
    ./scripts/release.sh 0.19   # Replace 0.19 with the version you're cutting the branch for :)

#### Check that everything works

Make absolutely sure basic iOS and Android workflow works on master, see the instructions printed by `release.sh`.
  
#### Push to github

  - Check git history, the last commit should be "[0.19-rc] Bump version numbers" (with the correct version)
  - `git push origin 0.version_you_are_releasing-stable`

## Do a release

Skip this for now, ping @mkonicek on messenger and he'll handle it. Docs [here](https://github.com/facebook/react-native/blob/master/Releases-publish.md).

## Track bug reports from the community during the following two weeks and make sure they get fixed

A good way to do this is to create a github issue and post about it so people can report bugs: https://github.com/facebook/react-native/issues/5201
