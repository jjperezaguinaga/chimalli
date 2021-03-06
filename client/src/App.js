import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import SecurityIcon from '@material-ui/icons/Security';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import getWeb3 from "./utils/getWeb3";
import Codex from './utils/codexAPI';
import locksmith from './utils/locksmith';

import ChimalliCard from './components/ChimalliCard';

const secrets = require('secrets.js');

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  icon: {
    marginRight: theme.spacing.unit * 2,
  },
  heroUnit: {
    backgroundColor: theme.palette.background.paper,
  },
  heroContent: {
    maxWidth: 600,
    margin: '0 auto',
    padding: `${theme.spacing.unit * 8}px 0 ${theme.spacing.unit * 6}px`,
  },
  heroButtons: {
    marginTop: theme.spacing.unit * 4,
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
      width: 1100,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  cardGrid: {
    padding: `${theme.spacing.unit * 8}px 0`,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  cardAddress: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  footer: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing.unit * 6,
  },
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      codex: [],
      keypair: locksmith.retrieveKeys(),
      generatingKeys: false,
      account: null,
      web3: null,
      keeper: null,
      threshold: localStorage.getItem('threshold') || 2,
      amountOfPieces: localStorage.getItem('amountOfPieces') || 3,
      secret: 'I know where the aztec gold is.',
      pieces: JSON.parse(localStorage.getItem('pieces')) || [],
      codexAPI: null,
      chimalliAPI: null
    }
    this.hasKeypair = this.hasKeypair.bind(this);
    this.showPublicKey = this.showPublicKey.bind(this);
    this.splitSecret = this.splitSecret.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createChimalli = this.createChimalli.bind(this);
    this.loadCodex = this.loadCodex.bind(this);
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const [ account ] = await web3.eth.getAccounts();
      const keeper = account;
      const codexAPI = new Codex(web3);
      await codexAPI.start();
      this.setState({ web3, keeper, account, codexAPI });
      await this.loadCodex();
    } catch(error) {
      console.error(error);
    }
  }

  async loadCodex() {
    const { codexAPI, account } = this.state;
    const codex = await codexAPI.loadCodex(account) || [];
    console.log('[ App ] loadCodex | codex', codex);
    this.setState({ codex })
  }

  showPublicKey() {
    const { keypair } = this.state;
    alert(keypair.publicKey);
  }

  hasKeypair() {
    const { keypair } = this.state;
    return keypair.privateKey && keypair.publicKey
  }

  generateKeys = async () => {
    this.setState({ keypair: locksmith.EMPTY_KEYS, generatingKeys: true }, async () => {
      const keypair = await locksmith.generateKeys()
      this.setState({ keypair, generatingKeys: false })
    });
  }
  
  splitSecret() {
    const { secret, amountOfPieces, threshold } = this.state;
    const hexSecret = secrets.str2hex(secret);
    const pieces = secrets.share(hexSecret, ~~amountOfPieces, ~~threshold);
    this.setState({ pieces });
    localStorage.setItem('threshold', ~~threshold);
    localStorage.setItem('amountOfPieces', ~~amountOfPieces);
    localStorage.setItem('pieces', JSON.stringify(pieces));
  }

  showPieces() {
    const { pieces } = this.state;
    alert(JSON.stringify(pieces));
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  createChimalli = async () => {
    const { codexAPI, keeper, codex } = this.state;
    const transactionReceipt = await codexAPI.createChimalli(keeper, alert);
    // We’ll give it a bit of time for the status to reflect before loading it
    transactionReceipt && setTimeout(this.loadCodex, 2000);
  }


  render () {
    const { classes } = this.props;
    const { web3, codex, generatingKeys, threshold, pieces, amountOfPieces, secret, keeper } = this.state;

    const renderMessage = (message) =>
    <Grid item sm={6} md={4} lg={3}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h5" component="h2">
            { message.title }
          </Typography>
          <Typography>
            { message.content }
          </Typography>
        </CardContent>
      </Card>
    </Grid>

    return (
      <React.Fragment>
        <CssBaseline />
        <AppBar position="static" className={classes.appBar}>
          <Toolbar>
            <SecurityIcon className={classes.icon} />
            <Typography variant="h6" color="inherit" noWrap>
              Chimalli
            </Typography>
          </Toolbar>
        </AppBar>
        <main>
          <div className={classes.heroUnit}>
            <div className={classes.heroContent}>
              <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
                Chimalli
              </Typography>
              <Typography variant="h6" align="center" color="textSecondary" paragraph>
                Chimalli is an experiment for showcasing how decentralised backups can be made using
                PGP encryption and Shamir's Secret Sharing algorithm on top of the Ethereum network.
              </Typography>
              <br/>
              <Typography component="h3" variant="h4" align="center" color="textPrimary" gutterBottom>
                Secret Sharing
              </Typography>
              <Typography align="center" color="textPrimary" paragraph>
                Chimalli uses <a rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing" target="_blank">Shamir's Secret Sharing (SSS)</a>
                &nbsp; algorithm to safely split a known secret into <b>unreveleaing pieces</b>, that when put together return the content of 
                the original secret. SSS works by providing a <b>threshold</b> of required pieces and the total of pieces that the secret will
                be split of.
              </Typography>
              <Grid container spacing={16} justify="center" style={{ marginBottom: '48px' }}>
                  <Grid item style={{ display: 'flex', alignItems: 'baseline' }}>
                    Require
                    <TextField
                      style={{ margin: '0 5px', width: '100px' }}
                      id="threshold"
                      label="threshold"
                      margin="normal"
                      type="number"
                      value={threshold}
                      onChange={this.handleChange('threshold')}
                    />
                    parts out
                    <TextField
                      style={{ margin: '0 5px', width: '100px' }}
                      id="amountOfPieces"
                      label="pieces"
                      margin="normal"
                      type="number"
                      value={amountOfPieces}
                      onChange={this.handleChange('amountOfPieces')}
                    />
                    to reconstruct the secret.
                  </Grid>
                  <Grid item style={{ display: 'flex', alignItems: 'baseline', width: '90%' }}>
                    <TextField
                      style={{ margin: '0 5px', width: '100%' }}
                      id="secret"
                      label="secret"
                      margin="normal"
                      multiline
                      value={secret}
                      onChange={this.handleChange('secret')}
                    />
                  </Grid>
                  <Grid item>
                    <Button variant="contained" color="primary" onClick={() => this.splitSecret()}>
                      Split secret
                    </Button>
                  </Grid>
                  {
                    pieces.length > 0 &&
                    <Grid item>
                      <Button variant="outlined" color="primary" onClick={() => this.showPieces()}>
                        Show pieces
                      </Button>
                    </Grid>
                  }
              </Grid>
              <Typography component="h3" variant="h4" align="center" color="textPrimary" gutterBottom>
                Public Key Cryptography
              </Typography>
              <Typography align="center" color="textPrimary" paragraph>
                Since we want to store our pieces safely, Chimalli uses <a rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Public-key_cryptography" target="_blank">public-key</a>
                &nbsp;cryptography to first encrypt each of these pieces. We'll then store these
                 encrypted pieces in Ethereum contracts ("Chimallis") and manage them through a master
                 contract registry ("Codex"). To do so, we first need a PGP Keypair that we can use
                 for encryption, and afterwards, for decryption.
              </Typography>
              <div className={classes.heroButtons}>
                {
                  generatingKeys ?
                  <Typography variant="h4" align="center" color="textSecondary" paragraph>
                    Your keys are being generated. See the console for progress.
                  </Typography> :
                  <Grid container spacing={16} justify="center">
                    <Grid item>
                        <Button variant="contained" color="primary" onClick={() => this.generateKeys()}>
                          {
                            this.hasKeypair() ?
                              'Re-generate PGP keypairs' :
                              'Generate PGP keypairs'
                          }
                        </Button>
                    </Grid>
                    <Grid item>
                      {
                        this.hasKeypair() &&
                          <Button variant="outlined" color="primary" onClick={() => this.showPublicKey()}>
                            Show PGP public key
                          </Button>
                      }
                    </Grid>
                  </Grid>
                }
              </div>
              <Grid container spacing={16} justify="center">
                <Grid item>
                  <Typography align="center" color="textSecondary" paragraph>
                    Generating a RSA-4096 PGP Keypair can be CPU consuming. We are using Keybase&nbsp;
                    <a target='_blank' rel="noopener noreferrer" href='https://github.com/keybase/kbpgp'>kbpgp</a> implementation.
                    Please allow 1-2 minutes while we generate the keys. In the meantime, you can continue with
                    the next required steps, as this won’t interrupt the key generation process.
                  </Typography>
                </Grid>
              </Grid>
            </div>
          </div>
          <div className={classNames(classes.layout, classes.cardGrid)}>
            {/* End hero unit */}
            <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <Typography component="h3" variant="h4" align="center" color="textPrimary" gutterBottom>
              Distributed Codex
            </Typography>
            <Typography align="center" color="textPrimary" paragraph>
              Our Codex is a Smart Contract on top of the Ethereum Network that helps us manage small Chimalli instances. Each Chimalli
              can store an encrypted secret from our side in the form of an IPFS Hash. Each Chimalli is tied to a specific "Keeper", a
              known friend we can request the encrypted secret from. To create a chimalli, you need to provide an address that will be
              the "Keeper" of that secret. The "Keeper" will require to authorize requests from you to give your encrypted secret piece back.
            </Typography>
            <br/>
            <TextField
              style={{ margin: '0 5px', width: '100%', textAlign: 'center' }}
              id="keeper"
              label="keeper"
              helperText="This is your current Metamask account, but you can use any address."
              margin="normal"
              multiline
              value={keeper || 'Loading...'}
              onChange={this.handleChange('keeper')}
            />
            <br/>
            <Grid container spacing={16} justify="center">
              <Grid item>
                <Button style={{ marginBottom: '12px' }} variant="contained" color="primary" onClick={() => this.createChimalli()}>
                  Create chimalli
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" color="primary" onClick={() => this.loadCodex()}>
                  Reload codex
                </Button>
              </Grid>
            </Grid>            
            <br/>
            <Typography align="center" color="textSecondary" paragraph style={{width: "50%", margin: "auto"}}>
              For simplicity purposes of this example, we are defaulting to your Metamask account to be the Keeper of your chimallis, as
              you will be required to authorize requests against it. However, you can pick any address you want.
            </Typography>
            <br/>
            <Typography align="center" color="textSecondary" paragraph style={{width: "50%", margin: "auto"}}>
               If your new Chimalli does not appear after a couple seconds on a successful message, please reload the Codex. Sometimes it
               takes a bit of extra time while the Codex smart contract updates its storage.
            </Typography>
            <br/>
            </div>
            <Grid container spacing={40} justify={ codex.length <= 3  ? "center" : "flex-start" }>
              {
                codex.length === 0 ?
                  renderMessage({ title: 'Empty codex', content: 'Your codex currently has no Chimallis. Click “Create chimalli” to create one through our Smart Contract' }) :
                  codex.map( (address, index) => <ChimalliCard 
                    pieces={pieces} 
                    key={address} 
                    web3={web3} 
                    address={address} 
                    classes={classes} 
                    index={index} 
                    secret={secret}
                  /> )
              }
            </Grid>
          </div>
        </main>
        {/* Footer */}
        <footer className={classes.footer}>
          <Typography variant="h6" align="center" gutterBottom>
          A project by @jjperezaguinaga made with ❤️  from 🇲🇽
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" component="p">
            Consensys Academy 2019 Final Project Submission
          </Typography>
        </footer>
        {/* End footer */}
      </React.Fragment>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);