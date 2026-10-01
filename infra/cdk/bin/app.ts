import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

new NetworkStack(app, 'NetworkStack');

app.synth();
