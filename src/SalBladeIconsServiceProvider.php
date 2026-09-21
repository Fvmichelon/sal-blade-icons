<?php

declare(strict_types=1);

namespace Sal\SalBladeIcons;

use BladeUI\Icons\Factory;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\ServiceProvider;

final class SalBladeIconsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->registerConfig();

        $this->callAfterResolving(Factory::class, function (Factory $factory, Container $container) {
            $config = $container->make('config')->get('sal-icons', []);

            $factory->add('sal-icons', array_merge(
                ['path' => __DIR__.'/../resources/svg'],
                $config
            ));
        });
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../resources/svg' => public_path('vendor/sal-blade-icons'),
            ], 'sal-blade-icons');

            $this->publishes([
                __DIR__.'/../config/sal-icons.php' => $this->app->configPath('sal-icons.php'),
            ], 'sal-blade-icons-config');
        }
    }

    private function registerConfig(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/sal-icons.php', 'sal-icons');
    }
}
