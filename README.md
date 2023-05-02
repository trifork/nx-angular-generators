# NX-Angular-Generators

Generators to be used to create libs according to our guidelines found in @trifork/nx-angular

## Troubleshooting

Random errors (maybe referencing lock-file) can be related to different @nrwl versioning between host repo and this repo.
Explore differences in version with:
```
yarn list --pattern @nrwl
```

In general, the problem is mismatch in the _nx_ package or underlyin @nrwl/cli.
The versioning should either be completely fixed in both package.json or freed with `^`