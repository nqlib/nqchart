import { ComponentPreviewTabs } from "@/components/docs/charts/component-preview-tabs";
import { ComponentSource } from "@/components/docs/charts/component-source";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Index } from "@/registry/__index__";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps extends Omit<React.ComponentProps<"div">, "ref"> {
  name: string;
  align?: "center" | "start" | "end";
  description?: string;
  hideCode?: boolean;
  title?: string;
  containerClassName?: string;
}

export function ComponentPreview({
  name,
  className,
  align = "center",
  hideCode = false,
  title,
  containerClassName,
  ...props
}: ComponentPreviewProps) {
  const Component = Index[name]?.component;
  const metaClassName = Index[name]?.meta?.className;

  if (!Component) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Preview not found</AlertTitle>
        <AlertDescription>
          Component <code className="font-mono text-[0.75rem]">{name}</code> is not in the
          registry. Run <code className="font-mono text-[0.75rem]">pnpm registry:fresh</code> if you
          recently added it, or{" "}
          <a
            target="_blank"
            href="https://github.com/ctesibius/beecharts/issues"
            className="text-primary hover:underline"
          >
            open an issue
          </a>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ComponentPreviewTabs
      align={align}
      className={cn(metaClassName, className)}
      containerClassName={containerClassName}
      component={<Component />}
      hideCode={hideCode}
      source={<ComponentSource collapsible={false} name={name} />}
      title={title}
      {...props}
    />
  );
}
